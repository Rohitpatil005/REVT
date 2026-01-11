import { Invoice, INR } from './data/types';
import * as XLSX from 'xlsx';

interface GSTRow {
  'Invoice No.': string;
  'Date': string;
  'Customer Name': string;
  'Subtotal': number;
  'CGST': number;
  'SGST': number;
  'IGST': number;
  'Total Tax': number;
  'Total Amount': number;
}

interface MonthData {
  month: string;
  year: number;
  invoices: Invoice[];
}

export function exportGSTSalesAsExcel(invoices: Invoice[], org: string) {
  // Group invoices by month
  const monthMap = new Map<string, Invoice[]>();
  
  for (const inv of invoices) {
    const date = new Date(inv.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, []);
    }
    monthMap.get(monthKey)!.push(inv);
  }

  // Create workbook with sheets for each month
  const workbook = XLSX.utils.book_new();
  
  // Sort months chronologically
  const sortedMonths = Array.from(monthMap.keys()).sort();
  
  let grandTotal = 0;
  let grandCGST = 0;
  let grandSGST = 0;
  let grandIGST = 0;

  for (const monthKey of sortedMonths) {
    const monthInvoices = monthMap.get(monthKey)!;
    const rows: GSTRow[] = [];
    
    let monthSubtotal = 0;
    let monthCGST = 0;
    let monthSGST = 0;
    let monthIGST = 0;
    let monthTotal = 0;

    for (const inv of monthInvoices) {
      const row: GSTRow = {
        'Invoice No.': inv.number,
        'Date': new Date(inv.date).toLocaleDateString('en-IN'),
        'Customer Name': inv.customer.name,
        'Subtotal': inv.totals.subtotal,
        'CGST': inv.totals.cgst,
        'SGST': inv.totals.sgst,
        'IGST': inv.totals.igst,
        'Total Tax': inv.totals.cgst + inv.totals.sgst + inv.totals.igst,
        'Total Amount': inv.totals.total,
      };
      rows.push(row);

      monthSubtotal += inv.totals.subtotal;
      monthCGST += inv.totals.cgst;
      monthSGST += inv.totals.sgst;
      monthIGST += inv.totals.igst;
      monthTotal += inv.totals.total;
    }

    // Add totals row
    rows.push({
      'Invoice No.': 'TOTAL',
      'Date': '',
      'Customer Name': '',
      'Subtotal': monthSubtotal,
      'CGST': monthCGST,
      'SGST': monthSGST,
      'IGST': monthIGST,
      'Total Tax': monthCGST + monthSGST + monthIGST,
      'Total Amount': monthTotal,
    });

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: ['Invoice No.', 'Date', 'Customer Name', 'Subtotal', 'CGST', 'SGST', 'IGST', 'Total Tax', 'Total Amount'],
    });

    // Format numbers as currency
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = 3; col <= 8; col++) { // Columns D-I (Subtotal through Total Amount)
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].z = '#,##0.00';
        }
      }
    }

    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 }, // Invoice No.
      { wch: 12 }, // Date
      { wch: 20 }, // Customer Name
      { wch: 12 }, // Subtotal
      { wch: 10 }, // CGST
      { wch: 10 }, // SGST
      { wch: 10 }, // IGST
      { wch: 12 }, // Total Tax
      { wch: 14 }, // Total Amount
    ];

    const [year, month] = monthKey.split('-');
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    
    XLSX.utils.book_append_sheet(workbook, worksheet, monthName);

    grandTotal += monthTotal;
    grandCGST += monthCGST;
    grandSGST += monthSGST;
    grandIGST += monthIGST;
  }

  // Add summary sheet
  const summaryRows = sortedMonths.map((monthKey) => {
    const monthInvoices = monthMap.get(monthKey)!;
    const subtotal = monthInvoices.reduce((sum, inv) => sum + inv.totals.subtotal, 0);
    const cgst = monthInvoices.reduce((sum, inv) => sum + inv.totals.cgst, 0);
    const sgst = monthInvoices.reduce((sum, inv) => sum + inv.totals.sgst, 0);
    const igst = monthInvoices.reduce((sum, inv) => sum + inv.totals.igst, 0);
    const total = monthInvoices.reduce((sum, inv) => sum + inv.totals.total, 0);

    const [year, month] = monthKey.split('-');
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });

    return {
      'Month': monthName,
      'Invoices': monthInvoices.length,
      'Subtotal': subtotal,
      'CGST': cgst,
      'SGST': sgst,
      'IGST': igst,
      'Total Tax': cgst + sgst + igst,
      'Total Amount': total,
    };
  });

  // Add grand total
  summaryRows.push({
    'Month': 'GRAND TOTAL',
    'Invoices': invoices.length,
    'Subtotal': summaryRows.reduce((sum, row) => sum + row['Subtotal'], 0),
    'CGST': grandCGST,
    'SGST': grandSGST,
    'IGST': grandIGST,
    'Total Tax': summaryRows.reduce((sum, row) => sum + row['Total Tax'], 0),
    'Total Amount': grandTotal,
  });

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows, {
    header: ['Month', 'Invoices', 'Subtotal', 'CGST', 'SGST', 'IGST', 'Total Tax', 'Total Amount'],
  });

  summarySheet['!cols'] = [
    { wch: 20 }, // Month
    { wch: 12 }, // Invoices
    { wch: 12 }, // Subtotal
    { wch: 10 }, // CGST
    { wch: 10 }, // SGST
    { wch: 10 }, // IGST
    { wch: 12 }, // Total Tax
    { wch: 14 }, // Total Amount
  ];

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Generate filename
  const date = new Date();
  const filename = `GST-Sales-${org}-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}.xlsx`;

  // Write file
  XLSX.writeFile(workbook, filename);
}

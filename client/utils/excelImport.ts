import * as XLSX from 'xlsx';
import { Product, Customer, Org } from '@/lib/data/types';

/**
 * Parse Products from Excel file
 * Expected columns: name, hsn, unit, rate
 */
export function parseProductsFromExcel(file: File, org: Org): Promise<Omit<Product, 'id' | 'createdAt'>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet);
        
        const products: Omit<Product, 'id' | 'createdAt'>[] = rows
          .filter(row => row.name?.trim()) // Filter out empty rows
          .map(row => ({
            org,
            name: String(row.name || '').trim(),
            hsn: row.hsn ? String(row.hsn).trim() : undefined,
            unit: row.unit ? String(row.unit).trim() : undefined,
            rate: parseFloat(String(row.rate || '0')) || 0,
          }));
        
        resolve(products);
      } catch (error) {
        reject(new Error(`Failed to parse Excel: ${error instanceof Error ? error.message : String(error)}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse Customers from Excel file
 * Expected columns: name, gstin, state, address
 */
export function parseCustomersFromExcel(file: File, org: Org): Promise<Omit<Customer, 'id' | 'createdAt'>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet);
        
        const customers: Omit<Customer, 'id' | 'createdAt'>[] = rows
          .filter(row => row.name?.trim()) // Filter out empty rows
          .map(row => ({
            org,
            name: String(row.name || '').trim(),
            gstin: row.gstin ? String(row.gstin).trim() : undefined,
            state: row.state ? String(row.state).trim() : undefined,
            address: row.address ? String(row.address).trim() : undefined,
          }));
        
        resolve(customers);
      } catch (error) {
        reject(new Error(`Failed to parse Excel: ${error instanceof Error ? error.message : String(error)}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

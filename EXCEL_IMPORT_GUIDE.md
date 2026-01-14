# Excel Import Guide

This guide explains how to import Products and Customers from Excel files.

## Products Import

### Expected Columns
- **name** (required): Product name
- **hsn** (optional): HSN/SAC code
- **unit** (optional): Unit of measurement (e.g., Sq. Mtr, Roll, BDL, Nos)
- **rate** (optional): Price per unit

### Example Template

| name | hsn | unit | rate |
|------|-----|------|------|
| PVC Film 0.10mm | 39201010 | Sq. Mtr | 250.00 |
| XLPE Sheets | 39255646 | Rolls | 45.00 |
| Laminated Fabric | 52089990 | Sq. Mtr | 75.50 |

### How to Import
1. Go to **Products** page
2. Click **"Import from Excel"** button
3. Select an Excel file (.xlsx, .xls, or .csv)
4. The products will be imported automatically

---

## Customers Import

### Expected Columns
- **name** (required): Customer name
- **gstin** (optional): Customer's GSTIN
- **state** (optional): State name or State Code (e.g., Maharashtra, MH)
- **address** (optional): Customer address

### Example Template

| name | gstin | state | address |
|------|-------|-------|---------|
| Sandhya Inc | 27ADHBS4821E1Z | Maharashtra | Pune - 411027 |
| Local Trader | 27AAHFL7521A1Z | Maharashtra | Mumbai - 400001 |
| Interstate Supplier | 05AABCT1234A1Z | Karnataka | Bangalore - 560034 |

### How to Import
1. Go to **Customers** page
2. Click **"Import from Excel"** button
3. Select an Excel file (.xlsx, .xls, or .csv)
4. The customers will be imported automatically

---

## Important Notes

- **File Format**: Supports .xlsx (Excel), .xls (Excel 97-2003), and .csv formats
- **Required Fields**: Only the "name" field is mandatory for both products and customers
- **Empty Rows**: Empty rows are automatically skipped
- **Case Sensitivity**: Column names are case-sensitive (use lowercase)
- **Data Validation**: Invalid data is skipped; only valid entries are imported
- **Duplicate Handling**: Duplicates are treated as new entries; ensure names are unique if you want to avoid duplicates
- **Success Notification**: You'll see a toast message confirming the number of items imported

---

## Creating an Excel Template

### For Products:
1. Open Excel
2. Create columns: name, hsn, unit, rate
3. Enter your product data (one product per row)
4. Save as .xlsx or .csv

### For Customers:
1. Open Excel
2. Create columns: name, gstin, state, address
3. Enter your customer data (one customer per row)
4. Save as .xlsx or .csv

---

## Troubleshooting

**"No products/customers found"**
- Ensure the Excel file has at least one row with a "name" value
- Check that the first row contains headers

**Import failed with error**
- Ensure the file is a valid Excel or CSV file
- Check that all special characters are properly formatted
- Try opening the file in Excel first to verify it's not corrupted

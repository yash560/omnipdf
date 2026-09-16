import * as XLSX from 'xlsx';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRatePercent?: number;
  total: number;
}

export interface ExtractedInvoice {
  vendorName: string;
  vendorGstin?: string;
  vendorAddress?: string;
  customerName?: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  discountAmount?: number;
  totalAmount: number;
  items: InvoiceLineItem[];
}

/**
 * Generate Excel workbook (.xlsx) from structured invoice data
 */
export function exportInvoiceToExcel(invoice: ExtractedInvoice): Uint8Array {
  const wb = XLSX.utils.book_new();

  // 1. Overview Sheet
  const overviewData = [
    ['INVOICE SUMMARY', ''],
    ['Vendor Name', invoice.vendorName || ''],
    ['Vendor GSTIN / Tax ID', invoice.vendorGstin || ''],
    ['Customer Name', invoice.customerName || ''],
    ['Invoice Number', invoice.invoiceNumber || ''],
    ['Invoice Date', invoice.invoiceDate || ''],
    ['Due Date', invoice.dueDate || ''],
    ['Currency', invoice.currency || 'USD'],
    ['', ''],
    ['Subtotal', invoice.subtotal || 0],
    ['Tax / GST', invoice.taxAmount || 0],
    ['Discount', invoice.discountAmount || 0],
    ['Total Amount', invoice.totalAmount || 0],
  ];

  const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Summary');

  // 2. Line Items Sheet
  const itemsData = [
    ['#', 'Item Description', 'Qty', 'Unit Price', 'Tax %', 'Line Total'],
    ...invoice.items.map((it, idx) => [
      idx + 1,
      it.description,
      it.quantity,
      it.unitPrice,
      it.taxRatePercent || 0,
      it.total,
    ]),
  ];

  const wsItems = XLSX.utils.aoa_to_sheet(itemsData);
  XLSX.utils.book_append_sheet(wb, wsItems, 'Line Items');

  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(out);
}

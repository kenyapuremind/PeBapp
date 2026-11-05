/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TaxMode } from '../types';

/**
 * Format amount as Kenyan Shillings (KES)
 */
export function formatKES(amount: number, showDecimals: boolean = true): string {
  const safeAmount = isNaN(amount) ? 0 : amount;
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    currencyDisplay: 'code',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(safeAmount);
}

/**
 * Short KES formatter (e.g. KES 14.5k)
 */
export function formatCompactKES(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `KES ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `KES ${(amount / 1_000).toFixed(1)}k`;
  }
  return formatKES(amount, false);
}

/**
 * Compute line item tax and totals based on tax mode (Exclusive or Inclusive)
 */
export function calculateLineTax({
  quantity,
  unitPrice,
  discountPercent = 0,
  taxRatePercent = 16,
  taxMode = 'exclusive',
}: {
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxRatePercent?: number;
  taxMode?: TaxMode;
}) {
  const grossAmount = quantity * unitPrice;
  const discountAmount = grossAmount * (Math.max(0, Math.min(100, discountPercent)) / 100);
  const discountedBase = Math.max(0, grossAmount - discountAmount);
  const taxRate = Math.max(0, taxRatePercent) / 100;

  if (taxMode === 'exclusive') {
    const taxAmount = discountedBase * taxRate;
    const lineTotal = discountedBase + taxAmount;
    return {
      subtotal: discountedBase,
      taxAmount: Math.round(taxAmount * 100) / 100,
      lineTotal: Math.round(lineTotal * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
    };
  } else {
    // Inclusive: discountedBase is the total payable, tax is backed out
    const lineTotal = discountedBase;
    const netBase = lineTotal / (1 + taxRate);
    const taxAmount = lineTotal - netBase;
    return {
      subtotal: Math.round(netBase * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      lineTotal: Math.round(lineTotal * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
    };
  }
}

/**
 * Format standard ISO date string
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

/**
 * Generate a mailto: link for sending invoices or receipts directly to customer
 */
export function generateInvoiceEmailMailto({
  businessName,
  customerEmail,
  customerName,
  invoiceNumber,
  isReceipt = false,
  total,
  dueDate,
  paymentStatus,
  mpesaTill,
  mpesaPaybill,
  itemsList = [],
}: {
  businessName: string;
  customerEmail: string;
  customerName: string;
  invoiceNumber: string;
  isReceipt?: boolean;
  total: number;
  dueDate?: string;
  paymentStatus?: string;
  mpesaTill?: string;
  mpesaPaybill?: string;
  itemsList?: Array<{ name: string; quantity: number; unitPrice: number; lineTotal: number }>;
}): string {
  const docType = isReceipt ? 'Official Payment Receipt' : 'Invoice';
  const subject = encodeURIComponent(`${docType} #${invoiceNumber} from ${businessName}`);

  const itemsText = itemsList
    .map((item) => `  - ${item.name} (${item.quantity}x @ ${formatKES(item.unitPrice)}) = ${formatKES(item.lineTotal)}`)
    .join('\n');

  let paymentInfo = '';
  if (mpesaTill) {
    paymentInfo += `\nPayment Options (M-Pesa):\nBuy Goods Till: ${mpesaTill}\n`;
  } else if (mpesaPaybill) {
    paymentInfo += `\nPayment Options (M-Pesa):\nPaybill: ${mpesaPaybill}\nAccount: ${invoiceNumber}\n`;
  }

  const body = encodeURIComponent(
    `Dear ${customerName || 'Valued Customer'},\n\n` +
    `Please find the details for your ${docType.toLowerCase()} #${invoiceNumber} from ${businessName}.\n\n` +
    `Document Summary:\n` +
    `Total Amount: ${formatKES(total)}\n` +
    (dueDate ? `Due Date: ${formatDate(dueDate)}\n` : '') +
    (paymentStatus ? `Status: ${paymentStatus.toUpperCase()}\n` : '') +
    `\nItem Breakdown:\n` +
    (itemsText || '  (See attached details)') +
    `\n` +
    paymentInfo +
    `\nThank you for choosing ${businessName}! For any inquiries, please contact us.\n\n` +
    `Best regards,\n${businessName}`
  );

  return `mailto:${customerEmail || ''}?subject=${subject}&body=${body}`;
}

/**
 * Generate WhatsApp message URL for sending receipt/invoice summary
 */
export function generateWhatsAppLink({
  phone,
  businessName,
  customerName,
  invoiceNumber,
  total,
  isReceipt = false,
}: {
  phone: string;
  businessName: string;
  customerName: string;
  invoiceNumber: string;
  total: number;
  isReceipt?: boolean;
}): string {
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '254' + cleanPhone.slice(1);
  }
  const text = encodeURIComponent(
    `Hello ${customerName || 'Customer'},\nHere is your ${isReceipt ? 'Receipt' : 'Invoice'} #${invoiceNumber} from *${businessName}* for *${formatKES(total)}*.\nThank you for your business!`
  );
  return `https://wa.me/${cleanPhone}?text=${text}`;
}

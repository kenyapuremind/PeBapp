/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Printer,
  Mail,
  Share2,
  CheckCircle,
  X,
  FileText,
  DollarSign,
  Building,
  Smartphone,
  Calendar,
  AlertCircle,
  Clock,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { BusinessProfile, Invoice, User } from '../types';
import {
  formatDateTime,
  formatKES,
  generateInvoiceEmailMailto,
  generateWhatsAppLink,
} from '../utils/formatters';
import { downloadElementAsPDF, shareElementWithAutoAttachedPDF } from '../utils/pdfGenerator';

interface InvoiceReceiptModalProps {
  invoice: Invoice;
  business: BusinessProfile;
  currentUser: User;
  onClose: () => void;
  onMarkAsPaid?: (invoiceId: string, method: string, mpesaCode?: string) => void;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  invoice,
  business,
  currentUser,
  onClose,
  onMarkAsPaid,
}) => {
  const [docType, setDocType] = useState<'invoice' | 'receipt'>(
    invoice.paymentStatus === 'paid' ? 'receipt' : 'invoice'
  );
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payMethod, setPayMethod] = useState<'mpesa' | 'cash' | 'bank'>('mpesa');
  const [mpesaRef, setMpesaRef] = useState('');
  const [payAmount, setPayAmount] = useState(invoice.dueAmount || invoice.grandTotal);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    const docNumber = docType === 'receipt' ? (invoice.receiptNumber || invoice.invoiceNumber) : invoice.invoiceNumber;
    await downloadElementAsPDF('printable-invoice', `${docType}-${docNumber}.pdf`);
    setIsGeneratingPDF(false);
  };

  const handleShareWithPDF = async () => {
    setIsGeneratingPDF(true);
    const docNumber = docType === 'receipt' ? (invoice.receiptNumber || invoice.invoiceNumber) : invoice.invoiceNumber;
    const shareText = `${business.name} ${docType === 'receipt' ? 'Receipt' : 'Invoice'} #${docNumber}\n` +
      `Customer: ${invoice.entityName}\n` +
      `Amount: ${formatKES(invoice.grandTotal)}\n` +
      `Status: ${invoice.paymentStatus.toUpperCase()}\n` +
      `M-Pesa Till: ${business.mpesaTillNumber || 'N/A'}`;

    await shareElementWithAutoAttachedPDF({
      elementId: 'printable-invoice',
      title: `${business.name} ${docType === 'receipt' ? 'Receipt' : 'Invoice'} #${docNumber}`,
      text: shareText,
      filename: `${docType}-${docNumber}.pdf`,
    });
    setIsGeneratingPDF(false);
  };

  const emailUrl = generateInvoiceEmailMailto({
    businessName: business.name,
    customerEmail: invoice.entityEmail || '',
    customerName: invoice.entityName,
    invoiceNumber: docType === 'receipt' ? (invoice.receiptNumber || invoice.invoiceNumber) : invoice.invoiceNumber,
    isReceipt: docType === 'receipt',
    total: invoice.grandTotal,
    dueDate: invoice.dueDate,
    paymentStatus: invoice.paymentStatus,
    mpesaTill: business.mpesaTillNumber,
    mpesaPaybill: business.mpesaPaybillNumber,
    itemsList: invoice.items.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    })),
  });

  const whatsappUrl = generateWhatsAppLink({
    phone: invoice.entityPhone || '',
    businessName: business.name,
    customerName: invoice.entityName,
    invoiceNumber: docType === 'receipt' ? (invoice.receiptNumber || invoice.invoiceNumber) : invoice.invoiceNumber,
    total: invoice.grandTotal,
    isReceipt: docType === 'receipt',
  });

  const handleCopyText = () => {
    const text = `${business.name} ${docType === 'receipt' ? 'Receipt' : 'Invoice'} #${docType === 'receipt' ? (invoice.receiptNumber || invoice.invoiceNumber) : invoice.invoiceNumber}\n` +
      `Customer: ${invoice.entityName}\n` +
      `Amount: ${formatKES(invoice.grandTotal)}\n` +
      `Status: ${invoice.paymentStatus.toUpperCase()}\n` +
      `M-Pesa Till: ${business.mpesaTillNumber || 'N/A'}`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (onMarkAsPaid) {
      onMarkAsPaid(invoice.id, payMethod, mpesaRef);
      setShowPaymentForm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="no-print bg-slate-900 text-white px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">View:</span>
            <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setDocType('invoice')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  docType === 'invoice'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Tax Invoice
              </button>
              <button
                type="button"
                onClick={() => setDocType('receipt')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  docType === 'receipt'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Official Receipt
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              title="Download official PDF file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPDF ? 'Generating...' : 'Download PDF'}</span>
            </button>

            <button
              onClick={handleShareWithPDF}
              disabled={isGeneratingPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-colors"
              title="Share document with attached PDF directly"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share + PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
              title="Print document directly"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <a
              href={emailUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors"
              title="Email invoice directly to customer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Email</span>
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors"
              title="Share via WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Payment reminder banner if unpaid */}
        {invoice.paymentStatus !== 'paid' && !showPaymentForm && (
          <div className="no-print bg-amber-50 border-b border-amber-200 px-4 py-2.5 sm:px-6 flex items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Unpaid Balance:</strong> {formatKES(invoice.dueAmount || invoice.grandTotal)}
                {invoice.dueDate && ` · Due ${formatDateTime(invoice.dueDate)}`}
              </span>
            </div>
            {onMarkAsPaid && (
              <button
                onClick={() => setShowPaymentForm(true)}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-md shadow-xs transition-colors shrink-0"
              >
                Record Payment
              </button>
            )}
          </div>
        )}

        {/* Quick Payment Form Drawer */}
        {showPaymentForm && (
          <form onSubmit={handleRecordPayment} className="no-print bg-slate-50 border-b border-slate-200 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Record Customer Payment
              </h4>
              <button
                type="button"
                onClick={() => setShowPaymentForm(false)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full text-xs rounded-lg border-slate-300 bg-white py-2 px-3 border shadow-xs focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="mpesa">M-Pesa (Till / Paybill)</option>
                  <option value="cash">Cash in Hand</option>
                  <option value="bank">Bank Transfer / Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Amount (KES)</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full text-xs rounded-lg border-slate-300 bg-white py-2 px-3 border shadow-xs font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {payMethod === 'mpesa' ? 'M-Pesa Ref Code (e.g. RFT9412...)' : 'Reference / Receipt Note'}
                </label>
                <input
                  type="text"
                  placeholder={payMethod === 'mpesa' ? 'e.g. SDA8921890' : 'e.g. Bank slip #'}
                  value={mpesaRef}
                  onChange={(e) => setMpesaRef(e.target.value)}
                  className="w-full text-xs rounded-lg border-slate-300 bg-white py-2 px-3 border shadow-xs uppercase font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Confirm & Issue Receipt
              </button>
            </div>
          </form>
        )}

        {/* Printable Document Body */}
        <div id="printable-invoice" className="print-container p-6 sm:p-10 bg-white text-slate-800 text-sm overflow-y-auto max-h-[75vh] print:max-h-none">
          
          {/* Header Zone: Business Logo & Doc Title */}
          <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b border-slate-200 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-base shadow-xs">
                  BF
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
                  {business.name}
                </h1>
              </div>
              <p className="text-xs text-slate-500">{business.tradingName} · Kenya</p>
              <div className="mt-2 text-xs text-slate-600 space-y-0.5">
                <p>{business.address}, {business.city}</p>
                <p>Phone: <span className="font-mono">{business.phone}</span> · Email: {business.email}</p>
                <p className="font-medium text-slate-900">
                  KRA PIN: <span className="font-mono text-emerald-800 font-bold">{business.kraPin}</span>
                </p>
              </div>
            </div>

            <div className="sm:text-right shrink-0">
              <span className={`inline-block px-3 py-1 text-xs font-bold uppercase rounded-md tracking-wider ${
                docType === 'receipt'
                  ? 'bg-emerald-100 text-emerald-800'
                  : invoice.paymentStatus === 'paid'
                  ? 'bg-emerald-100 text-emerald-800'
                  : invoice.paymentStatus === 'partial'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {docType === 'receipt' ? 'OFFICIAL PAYMENT RECEIPT' : 'TAX INVOICE'}
              </span>

              <h2 className="mt-2 text-xl font-mono font-bold text-slate-900 tracking-tight">
                {docType === 'receipt'
                  ? (invoice.receiptNumber || `RCT-${invoice.invoiceNumber.replace('INV-', '')}`)
                  : invoice.invoiceNumber}
              </h2>

              <div className="mt-2 text-xs text-slate-500 space-y-0.5">
                <p>
                  <span>Issue Date: </span>
                  <span className="font-mono text-slate-800 font-medium">{formatDateTime(invoice.date)}</span>
                </p>
                {docType === 'invoice' && invoice.dueDate && (
                  <p>
                    <span>Due Date: </span>
                    <span className="font-mono text-slate-800 font-medium">{formatDateTime(invoice.dueDate)}</span>
                  </p>
                )}
                {invoice.mpesaCode && (
                  <p className="text-emerald-700 font-medium">
                    <span>M-Pesa Ref: </span>
                    <span className="font-mono font-bold">{invoice.mpesaCode}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Customer / Billed To Section */}
          <div className="py-5 grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-slate-200">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {docType === 'receipt' ? 'Received From (Customer)' : 'Bill To (Customer)'}
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">{invoice.entityName}</h3>
              <div className="mt-1 text-xs text-slate-600 space-y-0.5">
                {invoice.entityPhone && <p>Phone: <span className="font-mono">{invoice.entityPhone}</span></p>}
                {invoice.entityEmail && <p>Email: {invoice.entityEmail}</p>}
                {invoice.entityKraPin && (
                  <p>Customer KRA PIN: <span className="font-mono font-semibold">{invoice.entityKraPin}</span></p>
                )}
              </div>
            </div>

            <div className="sm:text-right bg-slate-50 p-3 rounded-xl border border-slate-100 print:bg-transparent print:border-none print:p-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Payment Channel Details</span>
              <div className="mt-1 text-xs text-slate-700 space-y-1">
                {business.mpesaTillNumber && (
                  <p>
                    <span className="text-slate-500">M-Pesa Buy Goods Till: </span>
                    <span className="font-mono font-bold text-emerald-700">{business.mpesaTillNumber}</span>
                  </p>
                )}
                {business.mpesaPaybillNumber && (
                  <p>
                    <span className="text-slate-500">Paybill: </span>
                    <span className="font-mono font-semibold">{business.mpesaPaybillNumber}</span> · Acc: <span className="font-mono font-semibold">{invoice.invoiceNumber}</span>
                  </p>
                )}
                {business.bankName && (
                  <p className="text-[11px] text-slate-500">
                    {business.bankName} · Acc: <span className="font-mono">{business.bankAccountNumber}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 pr-2">#</th>
                    <th className="py-2.5 px-2">Description</th>
                    <th className="py-2.5 px-2 text-right">Qty</th>
                    <th className="py-2.5 px-2 text-right">Unit Price</th>
                    {invoice.discountTotal > 0 && <th className="py-2.5 px-2 text-right">Disc %</th>}
                    <th className="py-2.5 px-2 text-right">VAT Rate</th>
                    <th className="py-2.5 pl-2 text-right">Total (KES)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 pr-2 text-slate-400 font-sans">{idx + 1}</td>
                      <td className="py-3 px-2 font-sans">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="text-[10px] text-slate-400">{item.type === 'service' ? 'Service / Labor' : `Unit: ${item.unit || 'Pcs'}`}</div>
                      </td>
                      <td className="py-3 px-2 text-right tabular-nums text-slate-700">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-2 text-right tabular-nums text-slate-700">
                        {formatKES(item.unitPrice)}
                      </td>
                      {invoice.discountTotal > 0 && (
                        <td className="py-3 px-2 text-right tabular-nums text-slate-500">
                          {item.discountPercent > 0 ? `${item.discountPercent}%` : '—'}
                        </td>
                      )}
                      <td className="py-3 px-2 text-right tabular-nums text-slate-500">
                        {item.taxRatePercent}%
                      </td>
                      <td className="py-3 pl-2 text-right tabular-nums font-bold text-slate-900">
                        {formatKES(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations & Summary Strip */}
            <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start gap-6">
              <div className="text-xs text-slate-500 max-w-sm space-y-1">
                <p className="font-medium text-slate-700">Tax Note:</p>
                <p>
                  VAT is calculated on an {invoice.taxMode === 'exclusive' ? 'Exclusive (added to net)' : 'Inclusive (built-in)'} basis at {invoice.taxRatePercent}%.
                  Compliant with Kenya Revenue Authority e-TIMS / VAT regulations.
                </p>
                {invoice.notes && (
                  <p className="mt-2 text-slate-600 italic">
                    Note: "{invoice.notes}"
                  </p>
                )}
              </div>

              <div className="w-full sm:w-64 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono tabular-nums">{formatKES(invoice.subtotal)}</span>
                </div>

                {invoice.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount:</span>
                    <span className="font-mono tabular-nums">- {formatKES(invoice.discountTotal)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>KRA VAT ({invoice.taxRatePercent}%):</span>
                  <span className="font-mono tabular-nums">{formatKES(invoice.taxAmount)}</span>
                </div>

                <div className="pt-2 border-t border-slate-300 flex justify-between text-sm font-bold text-slate-900">
                  <span>Grand Total:</span>
                  <span className="font-mono tabular-nums text-base text-emerald-800">{formatKES(invoice.grandTotal)}</span>
                </div>

                <div className="flex justify-between text-slate-600 pt-1">
                  <span>Amount Paid:</span>
                  <span className="font-mono tabular-nums font-semibold text-emerald-700">
                    {formatKES(invoice.paidAmount || 0)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-200">
                  <span>Balance Due:</span>
                  <span className={`font-mono tabular-nums ${invoice.dueAmount > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                    {formatKES(invoice.dueAmount || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer & Authorization Stamp */}
          <div className="mt-8 pt-6 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-end gap-6">
            <div>
              <p className="font-semibold text-slate-800">{business.invoiceFooterNote}</p>
              <p className="mt-1 text-[11px]">Goods once sold in good order are not returnable without authorization.</p>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Generated digitally via BiasharaFlow ERP · Cashier: {invoice.createdByName}</span>
              </div>
            </div>

            <div className="text-center sm:text-right">
              <div className="h-12 border-b border-dashed border-slate-400 w-44 mx-auto sm:ml-auto"></div>
              <p className="text-[10px] uppercase font-semibold text-slate-400 mt-1">Authorized Signature & Stamp</p>
            </div>
          </div>

        </div>

        {/* Bottom Modal Actions (Hidden when printing) */}
        <div className="no-print bg-slate-50 border-t border-slate-200 px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleCopyText}
            className="text-xs text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1.5"
          >
            <span>{copiedLink ? 'Copied Details!' : 'Copy Summary'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors inline-flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Document</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

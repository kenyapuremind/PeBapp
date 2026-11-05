/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  Receipt,
  Printer,
  Mail,
  Share2,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Download,
} from 'lucide-react';
import { BusinessProfile, Customer, Invoice, User } from '../types';
import { formatDate, formatDateTime, formatKES, generateInvoiceEmailMailto, generateWhatsAppLink } from '../utils/formatters';
import { exportToCSV } from '../utils/pdfGenerator';

interface SalesInvoicesViewProps {
  sales: Invoice[];
  business: BusinessProfile;
  currentUser: User;
  onOpenCreateModal: () => void;
  onSelectInvoice: (invoice: Invoice) => void;
}

export const SalesInvoicesView: React.FC<SalesInvoicesViewProps> = ({
  sales,
  business,
  currentUser,
  onOpenCreateModal,
  onSelectInvoice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');

  const filteredSales = sales.filter((s) => {
    if (s.type !== 'sale') return false;
    if (statusFilter !== 'all' && s.paymentStatus !== statusFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.invoiceNumber.toLowerCase().includes(q) ||
      (s.receiptNumber && s.receiptNumber.toLowerCase().includes(q)) ||
      s.entityName.toLowerCase().includes(q) ||
      (s.mpesaCode && s.mpesaCode.toLowerCase().includes(q))
    );
  });

  const handleExportCSV = () => {
    const data = filteredSales.map((s) => ({
      InvoiceNumber: s.invoiceNumber,
      ReceiptNumber: s.receiptNumber || '',
      Customer: s.entityName,
      Phone: s.entityPhone || '',
      KraPin: s.entityKraPin || '',
      Date: s.date,
      DueDate: s.dueDate || '',
      Subtotal: s.subtotal,
      Discount: s.discountTotal,
      VAT_Tax: s.taxAmount,
      GrandTotal: s.grandTotal,
      PaidAmount: s.paidAmount,
      BalanceDue: s.dueAmount,
      PaymentMethod: s.paymentMethod,
      PaymentStatus: s.paymentStatus,
      MpesaRef: s.mpesaCode || '',
    }));
    exportToCSV(data, `Sales-Invoices-${business.name.replace(/\s+/g, '_')}.csv`);
  };

  // Aggregate metrics
  const totalInvoiced = sales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalCollected = sales.reduce((sum, s) => sum + (s.paidAmount || (s.paymentStatus === 'paid' ? s.grandTotal : 0)), 0);
  const totalDue = sales.reduce((sum, s) => sum + (s.dueAmount > 0 ? s.dueAmount : (s.paymentStatus !== 'paid' ? s.grandTotal - (s.paidAmount || 0) : 0)), 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Action */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            Point of Sale & Receivables
          </span>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Sales, Tax Invoices & Customer Receipts
          </h2>
          <p className="text-xs text-slate-500">
            Generate, print, download PDF, or export sales directly from phone or desktop
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenCreateModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Sale / Invoice</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Invoiced Sales</span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">{formatKES(totalInvoiced)}</div>
          <span className="text-[10px] text-slate-500">{sales.length} total invoices issued</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Total Collected Cash/M-Pesa</span>
          <div className="text-xl font-bold font-mono text-emerald-800 mt-1">{formatKES(totalCollected)}</div>
          <span className="text-[10px] text-slate-500">Settled receipts in bank & till</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Uncollected Customer Debt</span>
          <div className="text-xl font-bold font-mono text-amber-700 mt-1">{formatKES(totalDue)}</div>
          <span className="text-[10px] text-slate-500">Awaiting payment / overdue</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status segment control */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
            }`}
          >
            All ({sales.length})
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === 'paid' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
            }`}
          >
            Paid
          </button>
          <button
            onClick={() => setStatusFilter('partial')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === 'partial' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
            }`}
          >
            Partial
          </button>
          <button
            onClick={() => setStatusFilter('unpaid')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === 'unpaid' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
            }`}
          >
            Unpaid / Credit
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search invoice, customer, M-Pesa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-300 focus:bg-white"
          />
        </div>
      </div>

      {/* Invoices List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Invoice / Receipt #</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Tax (VAT)</th>
                <th className="py-3 px-4 text-right">Grand Total (KES)</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-sans italic">
                    No sales or invoices match your filter.
                  </td>
                </tr>
              ) : (
                filteredSales.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => onSelectInvoice(inv)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{inv.invoiceNumber}</div>
                      {inv.receiptNumber && (
                        <div className="text-[10px] text-emerald-700 font-sans font-medium">
                          Receipt: {inv.receiptNumber}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 font-sans">
                      <div className="font-semibold text-slate-900">{inv.entityName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {inv.entityPhone} {inv.entityKraPin ? `· PIN: ${inv.entityKraPin}` : ''}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-sans text-slate-600 whitespace-nowrap">
                      <div>{formatDate(inv.date)}</div>
                      {inv.dueDate && inv.paymentStatus !== 'paid' && (
                        <div className="text-[10px] text-rose-600 font-medium">Due: {formatDate(inv.dueDate)}</div>
                      )}
                    </td>

                    <td className="py-3 px-4 font-sans">
                      <span className="font-medium text-slate-700 capitalize">{inv.paymentMethod}</span>
                      {inv.mpesaCode && (
                        <span className="block font-mono text-[10px] text-emerald-700 font-bold">
                          {inv.mpesaCode}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-sans">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        inv.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.paymentStatus === 'partial'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {inv.paymentStatus}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums text-slate-600">
                      {formatKES(inv.taxAmount)}
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums font-bold text-slate-900 text-sm">
                      {formatKES(inv.grandTotal)}
                    </td>

                    <td className="py-3 px-4 text-center font-sans">
                      <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectInvoice(inv)}
                          className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                          title="View & Print Document"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={generateInvoiceEmailMailto({
                            businessName: business.name,
                            customerEmail: inv.entityEmail || '',
                            customerName: inv.entityName,
                            invoiceNumber: inv.invoiceNumber,
                            isReceipt: inv.paymentStatus === 'paid',
                            total: inv.grandTotal,
                            dueDate: inv.dueDate,
                            paymentStatus: inv.paymentStatus,
                            mpesaTill: business.mpesaTillNumber,
                          })}
                          className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                          title="Email directly to customer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>

                        <a
                          href={generateWhatsAppLink({
                            phone: inv.entityPhone || '',
                            businessName: business.name,
                            customerName: inv.entityName,
                            invoiceNumber: inv.invoiceNumber,
                            total: inv.grandTotal,
                            isReceipt: inv.paymentStatus === 'paid',
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
                          title="Share via WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

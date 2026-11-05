/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Search, Filter, Receipt, DollarSign, Calendar, CheckCircle, Clock, Download } from 'lucide-react';
import { ExpenseRecord, Supplier, User } from '../types';
import { formatDate, formatKES } from '../utils/formatters';
import { exportToCSV } from '../utils/pdfGenerator';

interface ExpensesViewProps {
  expenses: ExpenseRecord[];
  suppliers: Supplier[];
  currentUser: User;
  onOpenCreateModal: () => void;
  onMarkExpensePaid?: (expenseId: string) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  suppliers,
  currentUser,
  onOpenCreateModal,
  onMarkExpensePaid,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredExpenses = expenses.filter((e) => {
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.description.toLowerCase().includes(q) ||
      e.supplierName.toLowerCase().includes(q) ||
      (e.billNumber && e.billNumber.toLowerCase().includes(q)) ||
      (e.mpesaCode && e.mpesaCode.toLowerCase().includes(q))
    );
  });

  const handleExportCSV = () => {
    const data = filteredExpenses.map((e) => ({
      BillNumber: e.billNumber || 'EXP',
      Date: e.date,
      DueDate: e.dueDate || '',
      Category: e.category,
      Vendor: e.supplierName,
      Description: e.description,
      Amount: e.amount,
      VAT_Tax: e.taxAmount,
      TotalWithTax: e.totalWithTax,
      PaymentMethod: e.paymentMethod,
      PaymentStatus: e.paymentStatus,
      MpesaRef: e.mpesaCode || '',
    }));
    exportToCSV(data, 'Expenses-Report.csv');
  };

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.totalWithTax, 0);
  const totalVatInput = expenses.reduce((sum, e) => sum + (e.taxAmount || 0), 0);
  const totalPendingBills = expenses
    .filter((e) => e.paymentStatus === 'pending')
    .reduce((sum, e) => sum + e.totalWithTax, 0);

  const categories = Array.from(new Set(expenses.map((e) => e.category)));

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
            Cost & Payables Control
          </span>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Operational Expenses & Supplier Bills
          </h2>
          <p className="text-xs text-slate-500">
            Log overhead, vendor purchases, utilities, payroll, and deductible input VAT
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
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Record Expense</span>
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Operating Expenses</span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">{formatKES(totalExpenseAmount)}</div>
          <span className="text-[10px] text-slate-500">{expenses.length} expense records</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Deductible Input VAT (KRA)</span>
          <div className="text-xl font-bold font-mono text-emerald-800 mt-1">{formatKES(totalVatInput)}</div>
          <span className="text-[10px] text-slate-500">Reduces your net VAT payable</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Pending Supplier Bills</span>
          <div className="text-xl font-bold font-mono text-rose-700 mt-1">{formatKES(totalPendingBills)}</div>
          <span className="text-[10px] text-slate-500">Accounts payable debt</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <span className="font-semibold text-slate-500 shrink-0">Category:</span>
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              categoryFilter === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search vendor, memo, bill #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-300 focus:bg-white"
          />
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Bill # / Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Vendor / Payee</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Tax (VAT)</th>
                <th className="py-3 px-4 text-right">Total (KES)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-sans italic">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{exp.billNumber || 'EXP'}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{formatDate(exp.date)}</div>
                    </td>

                    <td className="py-3 px-4 font-sans whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800">
                        {exp.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-sans font-medium text-slate-900">
                      {exp.supplierName}
                    </td>

                    <td className="py-3 px-4 font-sans text-slate-600 max-w-xs truncate">
                      {exp.description}
                    </td>

                    <td className="py-3 px-4 font-sans">
                      <span className="capitalize text-slate-700">{exp.paymentMethod}</span>
                      {exp.mpesaCode && (
                        <span className="block font-mono text-[10px] text-emerald-700 font-semibold">
                          {exp.mpesaCode}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums text-slate-500">
                      {formatKES(exp.taxAmount)}
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums font-bold text-slate-900 text-sm">
                      {formatKES(exp.totalWithTax)}
                    </td>

                    <td className="py-3 px-4 text-center font-sans">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        exp.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {exp.paymentStatus}
                      </span>
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

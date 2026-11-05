/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Plus,
  ArrowRight,
  ShoppingBag,
  Receipt,
  Package,
  Smartphone,
  CheckCircle,
  Clock,
  Printer,
  ChevronRight,
} from 'lucide-react';
import {
  BusinessProfile,
  Customer,
  ExpenseRecord,
  InventoryItem,
  Invoice,
  User,
} from '../types';
import { ROLE_PERMISSIONS } from '../utils/auth';
import { formatDate, formatDateTime, formatKES } from '../utils/formatters';

interface DashboardViewProps {
  sales: Invoice[];
  expenses: ExpenseRecord[];
  inventory: InventoryItem[];
  customers: Customer[];
  business: BusinessProfile;
  currentUser: User;
  onOpenCreateSale: () => void;
  onOpenCreateExpense: () => void;
  onOpenStockMovement: () => void;
  onSelectInvoice: (inv: Invoice) => void;
  onNavigateToTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  sales,
  expenses,
  inventory,
  customers,
  business,
  currentUser,
  onOpenCreateSale,
  onOpenCreateExpense,
  onOpenStockMovement,
  onSelectInvoice,
  onNavigateToTab,
}) => {
  const perms = ROLE_PERMISSIONS[currentUser.role];
  const todayStr = new Date().toDateString();

  // Daily statistics
  const todaySales = sales.filter(
    (s) => new Date(s.date).toDateString() === todayStr && s.type === 'sale'
  );
  const todaySalesTotal = todaySales.reduce((sum, s) => sum + s.grandTotal, 0);

  const todayExpenses = expenses.filter(
    (e) => new Date(e.date).toDateString() === todayStr
  );
  const todayExpensesTotal = todayExpenses.reduce((sum, e) => sum + e.totalWithTax, 0);
  const todayNet = todaySalesTotal - todayExpensesTotal;

  // Monthly summary
  const now = new Date();
  const currentMonthSales = sales.filter((s) => {
    const d = new Date(s.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const monthSalesTotal = currentMonthSales.reduce((sum, s) => sum + s.grandTotal, 0);

  // Low stock inventory items
  const lowStockItems = inventory.filter(
    (item) => item.type === 'product' && item.currentStock <= item.reorderLevel
  );

  // Overdue / Unpaid invoices
  const unpaidInvoices = sales.filter(
    (s) => s.type === 'sale' && s.paymentStatus !== 'paid'
  );
  const totalReceivables = unpaidInvoices.reduce(
    (sum, s) => sum + (s.dueAmount > 0 ? s.dueAmount : s.grandTotal - (s.paidAmount || 0)),
    0
  );

  // Payment method breakdown for all sales
  let mpesaTotal = 0;
  let cashTotal = 0;
  let bankTotal = 0;
  sales.forEach((s) => {
    const paid = s.paidAmount || (s.paymentStatus === 'paid' ? s.grandTotal : 0);
    if (s.paymentMethod === 'mpesa') mpesaTotal += paid;
    else if (s.paymentMethod === 'cash') cashTotal += paid;
    else if (s.paymentMethod === 'bank') bankTotal += paid;
  });
  const totalCollections = mpesaTotal + cashTotal + bankTotal || 1;

  return (
    <div className="space-y-6">
      
      {/* Welcome & Role Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-5 sm:p-6 rounded-2xl shadow-xs flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              {business.name}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-300">KRA PIN: {business.kraPin}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-1">
            Habari, {currentUser.name}!
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Logged in as <strong className="text-emerald-400">{perms.label}</strong> · Default Currency:{' '}
            <span className="font-mono font-bold text-white">KES (Kenya Shillings)</span>
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {perms.canRecordSales && (
            <button
              onClick={onOpenCreateSale}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-transform active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>New Sale / Receipt</span>
            </button>
          )}

          {perms.canRecordExpenses && (
            <button
              onClick={onOpenCreateExpense}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Receipt className="w-4 h-4" />
              <span>Record Expense</span>
            </button>
          )}

          {perms.canManageInventory && (
            <button
              onClick={onOpenStockMovement}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Package className="w-4 h-4" />
              <span>Stock Adjust</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Today's Sales
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg sm:text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {formatKES(todaySalesTotal)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {todaySales.length} transaction{todaySales.length === 1 ? '' : 's'} recorded
            </div>
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Today's Expenses
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg sm:text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {formatKES(todayExpensesTotal)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {todayExpenses.length} expense voucher{todayExpenses.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        {/* Today's Net Cash Flow */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Today's Net Cash
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-lg sm:text-2xl font-bold font-mono tabular-nums ${
              todayNet >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}>
              {formatKES(todayNet)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Sales minus expenses
            </div>
          </div>
        </div>

        {/* Pending Customer Debts (Receivables) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Customer Debts
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-lg sm:text-2xl font-bold font-mono text-amber-700 tabular-nums">
              {formatKES(totalReceivables)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {unpaidInvoices.length} unpaid / credit invoice{unpaidInvoices.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Banner Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h4 className="font-bold">Inventory Low Stock Alert ({lowStockItems.length} items)</h4>
              <p className="text-amber-800 text-[11px] mt-0.5">
                The following products have hit reorder thresholds:{' '}
                {lowStockItems.map((i) => `${i.name} (${i.currentStock} ${i.unit} left)`).join(', ')}.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenStockMovement}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shrink-0 shadow-xs"
          >
            Restock Now
          </button>
        </div>
      )}

      {/* Payment Channels & M-Pesa Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Payment Channels Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Payment Channels (Collections)
            </h3>
            <span className="text-[10px] text-slate-400">All-time</span>
          </div>

          <div className="space-y-3">
            {/* M-Pesa */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" /> M-Pesa (Till {business.mpesaTillNumber || 'Active'})
                </span>
                <span className="font-mono tabular-nums font-bold text-slate-900">
                  {formatKES(mpesaTotal)} ({totalCollections > 0 ? ((mpesaTotal / totalCollections) * 100).toFixed(0) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  style={{ width: `${totalCollections > 0 ? (mpesaTotal / totalCollections) * 100 : 0}%` }}
                  className="bg-emerald-600 h-full rounded-full transition-all"
                />
              </div>
            </div>

            {/* Bank Transfer */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Bank Transfer / Cheques</span>
                <span className="font-mono tabular-nums font-bold text-slate-900">
                  {formatKES(bankTotal)} ({totalCollections > 0 ? ((bankTotal / totalCollections) * 100).toFixed(0) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  style={{ width: `${totalCollections > 0 ? (bankTotal / totalCollections) * 100 : 0}%` }}
                  className="bg-blue-600 h-full rounded-full transition-all"
                />
              </div>
            </div>

            {/* Cash in Hand */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Cash in Hand</span>
                <span className="font-mono tabular-nums font-bold text-slate-900">
                  {formatKES(cashTotal)} ({totalCollections > 0 ? ((cashTotal / totalCollections) * 100).toFixed(0) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  style={{ width: `${totalCollections > 0 ? (cashTotal / totalCollections) * 100 : 0}%` }}
                  className="bg-slate-700 h-full rounded-full transition-all"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Total Receipts Collected:</span>
            <span className="font-mono font-bold text-slate-900">{formatKES(totalCollections)}</span>
          </div>
        </div>

        {/* Recent Invoices & Direct Print Feed */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Recent Daily Sales & Invoices
              </h3>
              <p className="text-[11px] text-slate-400">Click any transaction to print receipt or send email</p>
            </div>
            <button
              onClick={() => onNavigateToTab('sales')}
              className="text-xs text-emerald-600 font-semibold hover:text-emerald-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 overflow-hidden">
            {sales.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs italic">
                <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 font-medium not-italic">No sales recorded yet</p>
                <p className="text-[11px] text-slate-400 not-italic mt-0.5">Click "+ New Sale / Invoice" to issue your first KRA-compliant invoice.</p>
                <button
                  type="button"
                  onClick={onOpenCreateSale}
                  className="mt-3 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg not-italic shadow-xs"
                >
                  + Issue First Invoice
                </button>
              </div>
            ) : (
              sales.slice(0, 5).map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => onSelectInvoice(inv)}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 p-2 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      inv.paymentStatus === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : inv.paymentStatus === 'partial'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{inv.invoiceNumber}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          inv.paymentStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inv.paymentStatus === 'partial'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {inv.paymentStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium truncate max-w-xs">{inv.entityName}</p>
                      <p className="text-[10px] text-slate-400">{formatDateTime(inv.date)} · Cashier: {inv.createdByName}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs font-bold text-slate-900 block tabular-nums">
                      {formatKES(inv.grandTotal)}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase font-mono">
                      {inv.paymentMethod.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

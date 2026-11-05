/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  TrendingUp,
  Scale,
  BookOpen,
  DollarSign,
  Printer,
  Calendar,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Send,
  MessageSquare,
} from 'lucide-react';
import {
  Customer,
  ExpenseRecord,
  InventoryItem,
  Invoice,
  Supplier,
  BusinessProfile,
} from '../types';
import {
  calculateBalanceSheet,
  calculateMonthlyTrends,
  calculatePayablesAging,
  calculateProfitAndLoss,
  calculateReceivablesAging,
  calculateTrialBalance,
  DateFilterRange,
  generateTransactionLedger,
} from '../utils/accounting';
import { formatDate, formatDateTime, formatKES, generateWhatsAppLink } from '../utils/formatters';

interface ReportsSuiteViewProps {
  sales: Invoice[];
  expenses: ExpenseRecord[];
  inventory: InventoryItem[];
  customers: Customer[];
  suppliers: Supplier[];
  business: BusinessProfile;
  onOpenInvoice?: (invoice: Invoice) => void;
  onPaySupplier?: (supplierId: string, amount: number) => void;
  onReceiveCustomerPayment?: (customerId: string, amount: number) => void;
}

export const ReportsSuiteView: React.FC<ReportsSuiteViewProps> = ({
  sales,
  expenses,
  inventory,
  customers,
  suppliers,
  business,
  onOpenInvoice,
  onPaySupplier,
  onReceiveCustomerPayment,
}) => {
  const [reportTab, setReportTab] = useState<'pnl' | 'balance_sheet' | 'trial_balance' | 'ledger' | 'aging' | 'monthly'>('pnl');
  
  // Date filter for P&L and Ledger
  const [datePreset, setDatePreset] = useState<DateFilterRange['preset']>('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Search filter for ledger
  const [ledgerSearch, setLedgerSearch] = useState('');

  const dateFilter: DateFilterRange = {
    preset: datePreset,
    startDate: customStart,
    endDate: customEnd,
  };

  // Calculations
  const pnl = calculateProfitAndLoss({ sales, expenses, filter: dateFilter });
  const balanceSheet = calculateBalanceSheet({ sales, expenses, inventory, customers, suppliers });
  const trialBalance = calculateTrialBalance({ sales, expenses, inventory, customers, suppliers });
  const ledgerEntries = generateTransactionLedger({ sales, expenses });
  const receivablesAging = calculateReceivablesAging(customers, sales);
  const payablesAging = calculatePayablesAging(suppliers, expenses);
  const monthlyTrends = calculateMonthlyTrends(sales, expenses);

  const filteredLedger = ledgerEntries.filter((entry) => {
    if (!ledgerSearch) return true;
    const query = ledgerSearch.toLowerCase();
    return (
      entry.reference.toLowerCase().includes(query) ||
      entry.description.toLowerCase().includes(query) ||
      entry.account.toLowerCase().includes(query)
    );
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Navigation Bar */}
      <div className="no-print bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            Kenya Financial Accounting Suite
          </span>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Financial Statements & Executive Reports
          </h2>
          <p className="text-xs text-slate-500">
            Compliant with IFRS for SMEs and Kenya Revenue Authority (KRA) standard ledgers
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Preset Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as any)}
              className="text-xs bg-transparent border-none text-slate-800 font-semibold focus:ring-0 pr-6"
            >
              <option value="today">Today</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_quarter">This Quarter</option>
              <option value="this_year">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Report Segmented Tabs */}
      <div className="no-print flex overflow-x-auto gap-2 pb-1 text-xs">
        <button
          onClick={() => setReportTab('pnl')}
          className={`px-4 py-2 font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            reportTab === 'pnl'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Profit & Loss (P&L)</span>
        </button>

        <button
          onClick={() => setReportTab('balance_sheet')}
          className={`px-4 py-2 font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            reportTab === 'balance_sheet'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Balance Sheet</span>
        </button>

        <button
          onClick={() => setReportTab('trial_balance')}
          className={`px-4 py-2 font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            reportTab === 'trial_balance'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Trial Balance</span>
        </button>

        <button
          onClick={() => setReportTab('ledger')}
          className={`px-4 py-2 font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            reportTab === 'ledger'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Transaction Ledger</span>
        </button>

        <button
          onClick={() => setReportTab('aging')}
          className={`px-4 py-2 font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            reportTab === 'aging'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Payables & Receivables</span>
        </button>

        <button
          onClick={() => setReportTab('monthly')}
          className={`px-4 py-2 font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            reportTab === 'monthly'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Monthly Summaries</span>
        </button>
      </div>

      {/* PRINT-ONLY COMPANY HEADER */}
      <div className="print-only mb-6 border-b border-slate-300 pb-4">
        <h1 className="text-xl font-bold text-slate-900">{business.name}</h1>
        <p className="text-xs text-slate-600">KRA PIN: {business.kraPin} · Nairobi, Kenya</p>
        <p className="text-xs text-slate-600">Printed on {formatDateTime(new Date().toISOString())}</p>
      </div>

      {/* ================= REPORT 1: PROFIT & LOSS (INCOME STATEMENT) ================= */}
      {reportTab === 'pnl' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2 bg-slate-50">
            <div>
              <h3 className="text-base font-bold text-slate-900">Profit & Loss Statement (Income Statement)</h3>
              <p className="text-xs text-slate-500">Period: {datePreset.replace('_', ' ').toUpperCase()} · Currency: KES</p>
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                pnl.netOperatingProfit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                Net Margin: {pnl.netMarginPercent.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-8 space-y-6 max-w-4xl mx-auto">
            
            {/* 1. Revenue */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-1.5">
                <span>1. Revenue & Sales</span>
                <span>Amount (KES)</span>
              </div>
              <div className="flex justify-between items-center py-1.5 text-xs text-slate-700">
                <span>Gross Invoiced Sales ({pnl.salesCount} transactions)</span>
                <span className="font-mono tabular-nums font-semibold">{formatKES(pnl.grossRevenue)}</span>
              </div>
              {pnl.totalDiscounts > 0 && (
                <div className="flex justify-between items-center py-1.5 text-xs text-emerald-700">
                  <span>Less: Customer Trade Discounts</span>
                  <span className="font-mono tabular-nums">- {formatKES(pnl.totalDiscounts)}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 text-sm font-bold text-slate-900 border-t border-slate-200">
                <span>Net Sales Revenue</span>
                <span className="font-mono tabular-nums">{formatKES(pnl.netRevenue)}</span>
              </div>
            </div>

            {/* 2. Cost of Goods Sold (COGS) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-1.5">
                <span>2. Cost of Sales (COGS)</span>
                <span>Amount (KES)</span>
              </div>
              <div className="flex justify-between items-center py-1.5 text-xs text-slate-700">
                <span>Direct Product Cost of Inventory Sold</span>
                <span className="font-mono tabular-nums text-rose-600 font-semibold">- {formatKES(pnl.cogs)}</span>
              </div>
              <div className="flex justify-between items-center py-2 text-sm font-bold text-emerald-900 bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
                <div>
                  <span>Gross Profit</span>
                  <span className="text-xs text-emerald-700 font-normal ml-2">
                    (Gross Margin: {pnl.grossMarginPercent.toFixed(1)}%)
                  </span>
                </div>
                <span className="font-mono tabular-nums text-base">{formatKES(pnl.grossProfit)}</span>
              </div>
            </div>

            {/* 3. Operating Expenses */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-1.5">
                <span>3. Operating & Administrative Expenses</span>
                <span>Amount (KES)</span>
              </div>
              {pnl.expenseBreakdown.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">No operating expenses recorded in this period.</p>
              ) : (
                pnl.expenseBreakdown.map((exp) => (
                  <div key={exp.category} className="flex justify-between items-center py-1.5 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <span>{exp.category}</span>
                      <span className="text-[10px] text-slate-400">({exp.percentage.toFixed(0)}%)</span>
                    </div>
                    <span className="font-mono tabular-nums">{formatKES(exp.amount)}</span>
                  </div>
                ))
              )}
              <div className="flex justify-between items-center py-2 text-sm font-semibold text-slate-900 border-t border-slate-200">
                <span>Total Operating Expenses</span>
                <span className="font-mono tabular-nums text-rose-600 font-bold">- {formatKES(pnl.totalOperatingExpenses)}</span>
              </div>
            </div>

            {/* 4. Net Operating Profit */}
            <div className={`p-4 rounded-xl border flex justify-between items-center ${
              pnl.netOperatingProfit >= 0
                ? 'bg-emerald-900 text-white border-emerald-950'
                : 'bg-rose-900 text-white border-rose-950'
            }`}>
              <div>
                <span className="text-xs uppercase tracking-wider text-emerald-200 font-bold">
                  {pnl.netOperatingProfit >= 0 ? 'Net Operating Profit' : 'Net Operating Loss'}
                </span>
                <h4 className="text-xl font-bold mt-0.5">
                  {pnl.netOperatingProfit >= 0 ? 'SURPLUS' : 'DEFICIT'}
                </h4>
              </div>
              <div className="text-right">
                <span className="font-mono text-2xl font-bold tabular-nums">
                  {formatKES(pnl.netOperatingProfit)}
                </span>
                <div className="text-xs text-emerald-200 mt-0.5 font-mono">
                  Net Margin: {pnl.netMarginPercent.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* 5. VAT Tax Summary */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                KRA Value Added Tax (VAT) Reconciliation (16%)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-slate-500 block">Output VAT Collected:</span>
                  <span className="font-mono font-semibold text-slate-900">{formatKES(pnl.vatCollected)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Input VAT Deductible:</span>
                  <span className="font-mono font-semibold text-slate-900">{formatKES(pnl.vatPaid)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Net VAT Payable to KRA:</span>
                  <span className="font-mono font-bold text-emerald-800">{formatKES(pnl.netVatPayable)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= REPORT 2: BALANCE SHEET ================= */}
      {reportTab === 'balance_sheet' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2 bg-slate-50">
            <div>
              <h3 className="text-base font-bold text-slate-900">Statement of Financial Position (Balance Sheet)</h3>
              <p className="text-xs text-slate-500">As of {formatDate(balanceSheet.asOfDate)} · Certified Balanced</p>
            </div>
            {balanceSheet.isBalanced && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-md text-xs font-bold">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Assets = Liabilities + Equity</span>
              </span>
            )}
          </div>

          <div className="p-5 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Left Column: Assets */}
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-2 mb-3">
                  Assets
                </h4>

                <h5 className="text-xs font-bold text-slate-800 mb-2">Current Assets</h5>
                <div className="space-y-1.5 text-xs divide-y divide-slate-100">
                  <div className="flex justify-between py-1">
                    <span>Cash on Hand</span>
                    <span className="font-mono tabular-nums">{formatKES(balanceSheet.assets.current.cashInHand)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Bank Balances (Equity Bank)</span>
                    <span className="font-mono tabular-nums">{formatKES(balanceSheet.assets.current.bankBalance)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>M-Pesa Business Till / Paybill</span>
                    <span className="font-mono tabular-nums">{formatKES(balanceSheet.assets.current.mpesaBalance)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Accounts Receivable (Debtors)</span>
                    <span className="font-mono tabular-nums font-semibold">{formatKES(balanceSheet.assets.current.accountsReceivable)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Inventory (Stock at Cost)</span>
                    <span className="font-mono tabular-nums font-semibold">{formatKES(balanceSheet.assets.current.inventoryAssetValue)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-semibold text-slate-900 border-t border-slate-200">
                    <span>Total Current Assets</span>
                    <span className="font-mono tabular-nums">{formatKES(balanceSheet.assets.current.total)}</span>
                  </div>
                </div>

                <h5 className="text-xs font-bold text-slate-800 mt-4 mb-2">Non-Current (Fixed) Assets</h5>
                <div className="space-y-1.5 text-xs divide-y divide-slate-100">
                  <div className="flex justify-between py-1">
                    <span>Fixtures, Equipment & Vehicles</span>
                    <span className="font-mono tabular-nums">{formatKES(balanceSheet.assets.nonCurrent.equipmentAndFixtures)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-semibold text-slate-900 border-t border-slate-200">
                    <span>Total Non-Current Assets</span>
                    <span className="font-mono tabular-nums">{formatKES(balanceSheet.assets.nonCurrent.total)}</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-slate-900 text-white rounded-xl flex justify-between items-center text-sm font-bold">
                  <span>TOTAL ASSETS</span>
                  <span className="font-mono tabular-nums text-base">{formatKES(balanceSheet.assets.totalAssets)}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Liabilities & Equity */}
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-2 mb-3">
                  Liabilities & Equity
                </h4>

                <h5 className="text-xs font-bold text-slate-800 mb-2">Current Liabilities</h5>
                <div className="space-y-1.5 text-xs divide-y divide-slate-100">
                  <div className="flex justify-between py-1">
                    <span>Accounts Payable (Creditors)</span>
                    <span className="font-mono tabular-nums font-semibold">{formatKES(balanceSheet.liabilities.current.accountsPayable)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>KRA VAT Payable</span>
                    <span className="font-mono tabular-nums">{formatKES(balanceSheet.liabilities.current.kraVatPayable)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-semibold text-slate-900 border-t border-slate-200">
                    <span>Total Current Liabilities</span>
                    <span className="font-mono tabular-nums">{formatKES(balanceSheet.liabilities.current.total)}</span>
                  </div>
                </div>

                <h5 className="text-xs font-bold text-slate-800 mt-4 mb-2">Long-Term Liabilities</h5>
                <div className="space-y-1.5 text-xs divide-y divide-slate-100">
                  <div className="flex justify-between py-1">
                    <span>Commercial Term Loan</span>
                    <span className="font-mono tabular-nums">{formatKES(balanceSheet.liabilities.longTerm.bankLoan)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-semibold text-slate-900 border-t border-slate-200">
                    <span>Total Liabilities</span>
                    <span className="font-mono tabular-nums">{formatKES(balanceSheet.liabilities.totalLiabilities)}</span>
                  </div>
                </div>

                <h5 className="text-xs font-bold text-slate-800 mt-4 mb-2">Owner's Equity</h5>
                <div className="space-y-1.5 text-xs divide-y divide-slate-100">
                  <div className="flex justify-between py-1">
                    <span>Contributed Owner's Capital</span>
                    <span className="font-mono tabular-nums">{formatKES(balanceSheet.equity.ownerCapital)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Retained Earnings & Reserves</span>
                    <span className="font-mono tabular-nums">{formatKES(balanceSheet.equity.retainedEarnings)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-semibold text-slate-900 border-t border-slate-200">
                    <span>Total Equity</span>
                    <span className="font-mono tabular-nums">{formatKES(balanceSheet.equity.totalEquity)}</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-emerald-800 text-white rounded-xl flex justify-between items-center text-sm font-bold">
                  <span>TOTAL LIABILITIES & EQUITY</span>
                  <span className="font-mono tabular-nums text-base">{formatKES(balanceSheet.totalLiabilitiesAndEquity)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= REPORT 3: TRIAL BALANCE ================= */}
      {reportTab === 'trial_balance' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2 bg-slate-50">
            <div>
              <h3 className="text-base font-bold text-slate-900">General Trial Balance</h3>
              <p className="text-xs text-slate-500">Dual-Entry Verification · Debits Equal Credits</p>
            </div>
            {trialBalance.isBalanced && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-md text-xs font-bold">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Verified Balanced (Variance: KES 0.00)</span>
              </span>
            )}
          </div>

          <div className="p-4 sm:p-6 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-300 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Account Title</th>
                  <th className="py-2.5 px-3">Class</th>
                  <th className="py-2.5 px-3 text-right">Debit (KES)</th>
                  <th className="py-2.5 px-3 text-right">Credit (KES)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {trialBalance.accounts.map((acc, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-900">{acc.name}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-500 text-[11px]">{acc.category}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-slate-800">
                      {acc.debit > 0 ? formatKES(acc.debit) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-slate-800">
                      {acc.credit > 0 ? formatKES(acc.credit) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-900 font-mono font-bold bg-slate-50 text-xs">
                  <td colSpan={2} className="py-3 px-3 font-sans text-slate-900">
                    TOTALS
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-800 text-sm">
                    {formatKES(trialBalance.totalDebits)}
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-800 text-sm">
                    {formatKES(trialBalance.totalCredits)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ================= REPORT 4: TRANSACTION LEDGER ================= */}
      {reportTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-slate-50">
            <div>
              <h3 className="text-base font-bold text-slate-900">General Transaction Journal & Ledger</h3>
              <p className="text-xs text-slate-500">Audit trail of all invoices, expenses, and movements</p>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search ref #, customer, account..."
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-white rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div className="p-4 sm:p-6 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-300 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-2">Date</th>
                  <th className="py-2.5 px-2">Ref</th>
                  <th className="py-2.5 px-2">Description</th>
                  <th className="py-2.5 px-2">Account</th>
                  <th className="py-2.5 px-2 text-right">Debit (In)</th>
                  <th className="py-2.5 px-2 text-right">Credit (Out)</th>
                  <th className="py-2.5 px-2 text-right">Running (KES)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredLedger.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-2 whitespace-nowrap text-slate-500 font-sans">
                      {formatDate(row.date)}
                    </td>
                    <td className="py-2.5 px-2 whitespace-nowrap font-bold text-slate-900">
                      {row.reference}
                    </td>
                    <td className="py-2.5 px-2 font-sans text-slate-700 max-w-xs truncate">
                      {row.description}
                    </td>
                    <td className="py-2.5 px-2 font-sans text-slate-500 text-[11px]">
                      {row.account}
                    </td>
                    <td className="py-2.5 px-2 text-right tabular-nums text-emerald-700 font-semibold">
                      {row.debit > 0 ? formatKES(row.debit) : '—'}
                    </td>
                    <td className="py-2.5 px-2 text-right tabular-nums text-rose-600 font-semibold">
                      {row.credit > 0 ? formatKES(row.credit) : '—'}
                    </td>
                    <td className="py-2.5 px-2 text-right tabular-nums font-bold text-slate-900">
                      {formatKES(row.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= REPORT 5: ACCOUNTS PAYABLES & RECEIVABLES ================= */}
      {reportTab === 'aging' && (
        <div className="space-y-6">
          
          {/* Receivables (Customer Debtors) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">Accounts Receivable (Debtors Aging)</h3>
                <p className="text-xs text-slate-500">Unpaid customer invoices and credit balances</p>
              </div>
              <span className="font-mono text-sm font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                Total Debt: {formatKES(balanceSheet.assets.current.accountsReceivable)}
              </span>
            </div>

            <div className="p-4 sm:p-6 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Customer Name</th>
                    <th className="py-2.5 px-3">Phone</th>
                    <th className="py-2.5 px-3 text-right">0-30 Days</th>
                    <th className="py-2.5 px-3 text-right">31-60 Days</th>
                    <th className="py-2.5 px-3 text-right">61-90+ Days</th>
                    <th className="py-2.5 px-3 text-right">Total Owed</th>
                    <th className="py-2.5 px-3 text-center no-print">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receivablesAging.map((item) => (
                    <tr key={item.customer.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-medium text-slate-900">
                        {item.customer.name}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">
                        {item.customer.phone}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                        {formatKES(item.current0to30)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-amber-600 font-medium">
                        {formatKES(item.overdue31to60)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-rose-600 font-bold">
                        {formatKES(item.overdue61to90 + item.overdue90Plus)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                        {formatKES(item.totalOwed)}
                      </td>
                      <td className="py-3 px-3 text-center no-print">
                        <div className="flex justify-center gap-1.5">
                          <a
                            href={generateWhatsAppLink({
                              phone: item.customer.phone,
                              businessName: business.name,
                              customerName: item.customer.name,
                              invoiceNumber: 'STATEMENT',
                              total: item.totalOwed,
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg"
                            title="Send WhatsApp payment reminder"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payables (Supplier Creditors) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">Accounts Payable (Supplier Aging)</h3>
                <p className="text-xs text-slate-500">Outstanding bills owed to our suppliers and vendors</p>
              </div>
              <span className="font-mono text-sm font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-lg border border-rose-200">
                Total Bills: {formatKES(balanceSheet.liabilities.current.accountsPayable)}
              </span>
            </div>

            <div className="p-4 sm:p-6 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Supplier Name</th>
                    <th className="py-2.5 px-3">Contact</th>
                    <th className="py-2.5 px-3 text-right">0-30 Days</th>
                    <th className="py-2.5 px-3 text-right">31-60+ Days</th>
                    <th className="py-2.5 px-3 text-right">Total Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payablesAging.map((sup) => (
                    <tr key={sup.supplier.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-medium text-slate-900">
                        {sup.supplier.name}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {sup.supplier.phone}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                        {formatKES(sup.current0to30)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-rose-600 font-bold">
                        {formatKES(sup.overdue31to60 + sup.overdue90Plus)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                        {formatKES(sup.totalOwed)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ================= REPORT 6: MONTHLY SUMMARIES & TRENDS ================= */}
      {reportTab === 'monthly' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-5 sm:p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">6-Month Financial Velocity & Trend Comparison</h3>
            <p className="text-xs text-slate-500">Comparative revenue, operating overhead, and net earnings</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <span className="text-xs font-semibold text-emerald-800">Total 6-Month Invoiced Sales</span>
              <h4 className="text-xl font-bold font-mono text-emerald-950 mt-1">
                {formatKES(monthlyTrends.reduce((sum, m) => sum + m.sales, 0))}
              </h4>
            </div>

            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100">
              <span className="text-xs font-semibold text-rose-800">Total 6-Month Operating Expenses</span>
              <h4 className="text-xl font-bold font-mono text-rose-950 mt-1">
                {formatKES(monthlyTrends.reduce((sum, m) => sum + m.expenses, 0))}
              </h4>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white">
              <span className="text-xs font-semibold text-slate-300">Cumulative Net Surplus</span>
              <h4 className="text-xl font-bold font-mono text-white mt-1">
                {formatKES(monthlyTrends.reduce((sum, m) => sum + m.netProfit, 0))}
              </h4>
            </div>
          </div>

          {/* Comparative Month Bars */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Month-by-Month Breakdown
            </h4>

            <div className="space-y-3">
              {monthlyTrends.map((m) => {
                const maxVal = Math.max(
                  ...monthlyTrends.map((t) => Math.max(t.sales, t.expenses)),
                  100000
                );
                const salesWidth = `${Math.min(100, (m.sales / maxVal) * 100)}%`;
                const expWidth = `${Math.min(100, (m.expenses / maxVal) * 100)}%`;

                return (
                  <div key={m.monthKey} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-900">{m.label}</span>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-emerald-700">Sales: {formatKES(m.sales)}</span>
                        <span className="text-rose-600">Expenses: {formatKES(m.expenses)}</span>
                        <span className="font-bold text-slate-900">Net: {formatKES(m.netProfit)}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: salesWidth }}
                          className="bg-emerald-600 h-full rounded-full transition-all"
                        />
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: expWidth }}
                          className="bg-rose-500 h-full rounded-full transition-all"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

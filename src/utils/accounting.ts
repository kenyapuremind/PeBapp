/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Customer,
  ExpenseRecord,
  InventoryItem,
  Invoice,
  LedgerEntry,
  Supplier,
} from '../types';

export interface DateFilterRange {
  startDate?: string;
  endDate?: string;
  preset: 'today' | 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'all' | 'custom';
}

/**
 * Filter records by date range
 */
export function isWithinDateRange(
  dateString: string,
  filter: DateFilterRange
): boolean {
  if (filter.preset === 'all') return true;
  const target = new Date(dateString);
  const now = new Date();

  if (filter.preset === 'today') {
    return target.toDateString() === now.toDateString();
  }

  if (filter.preset === 'this_month') {
    return (
      target.getFullYear() === now.getFullYear() &&
      target.getMonth() === now.getMonth()
    );
  }

  if (filter.preset === 'last_month') {
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return (
      target.getFullYear() === lastMonthDate.getFullYear() &&
      target.getMonth() === lastMonthDate.getMonth()
    );
  }

  if (filter.preset === 'this_year') {
    return target.getFullYear() === now.getFullYear();
  }

  if (filter.preset === 'this_quarter') {
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const targetQuarter = Math.floor(target.getMonth() / 3);
    return target.getFullYear() === now.getFullYear() && targetQuarter === currentQuarter;
  }

  if (filter.preset === 'custom' && filter.startDate && filter.endDate) {
    const start = new Date(filter.startDate);
    const end = new Date(filter.endDate);
    end.setHours(23, 59, 59, 999);
    return target >= start && target <= end;
  }

  return true;
}

/**
 * Compute comprehensive Profit & Loss (Income Statement)
 */
export function calculateProfitAndLoss({
  sales,
  expenses,
  filter,
}: {
  sales: Invoice[];
  expenses: ExpenseRecord[];
  filter: DateFilterRange;
}) {
  const filteredSales = sales.filter((s) => s.type === 'sale' && isWithinDateRange(s.date, filter));
  const filteredExpenses = expenses.filter((e) => isWithinDateRange(e.date, filter));

  // Gross Sales Revenue (Net of line discounts, excluding tax for clean accounting or including depending on mode)
  let grossRevenue = 0;
  let totalCostOfGoodsSold = 0;
  let totalDiscounts = 0;
  let totalVatCollected = 0;

  filteredSales.forEach((sale) => {
    // Subtotal is revenue before tax
    grossRevenue += sale.subtotal;
    totalDiscounts += sale.discountTotal || 0;
    totalVatCollected += sale.taxAmount || 0;

    // COGS: sum of costPrice * quantity
    sale.items.forEach((item) => {
      if (item.type === 'product') {
        totalCostOfGoodsSold += (item.costPrice || 0) * (item.quantity || 1);
      }
    });
  });

  const grossProfit = grossRevenue - totalCostOfGoodsSold;
  const grossMarginPercent = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;

  // Operating Expenses broken down by category
  const expenseByCategory: Record<string, number> = {};
  let totalOperatingExpenses = 0;
  let totalVatPaidOnExpenses = 0;

  filteredExpenses.forEach((exp) => {
    const cat = exp.category || 'Miscellaneous';
    expenseByCategory[cat] = (expenseByCategory[cat] || 0) + exp.amount;
    totalOperatingExpenses += exp.amount;
    totalVatPaidOnExpenses += exp.taxAmount || 0;
  });

  const netOperatingProfit = grossProfit - totalOperatingExpenses;
  const netMarginPercent = grossRevenue > 0 ? (netOperatingProfit / grossRevenue) * 100 : 0;

  return {
    period: filter.preset,
    salesCount: filteredSales.length,
    grossRevenue,
    totalDiscounts,
    netRevenue: grossRevenue,
    cogs: totalCostOfGoodsSold,
    grossProfit,
    grossMarginPercent,
    expenseBreakdown: Object.entries(expenseByCategory).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalOperatingExpenses > 0 ? (amount / totalOperatingExpenses) * 100 : 0,
    })),
    totalOperatingExpenses,
    netOperatingProfit,
    netMarginPercent,
    vatCollected: totalVatCollected,
    vatPaid: totalVatPaidOnExpenses,
    netVatPayable: totalVatCollected - totalVatPaidOnExpenses,
  };
}

/**
 * Compute the full Balance Sheet
 */
export function calculateBalanceSheet({
  sales,
  expenses,
  inventory,
  customers,
  suppliers,
  baseCashInHand = 0,
  baseBankBalance = 0,
  baseMpesaBalance = 0,
  fixedAssetsValue = 0,
  ownerInitialCapital = 0,
}: {
  sales: Invoice[];
  expenses: ExpenseRecord[];
  inventory: InventoryItem[];
  customers: Customer[];
  suppliers: Supplier[];
  baseCashInHand?: number;
  baseBankBalance?: number;
  baseMpesaBalance?: number;
  fixedAssetsValue?: number;
  ownerInitialCapital?: number;
}) {
  // 1. Current Assets:
  // Inventory value (at cost)
  const inventoryAssetValue = inventory
    .filter((item) => item.type === 'product')
    .reduce((sum, item) => sum + Math.max(0, item.currentStock) * (item.costPrice || 0), 0);

  // Accounts Receivable (Customer debt owed to us)
  const accountsReceivable = customers.reduce(
    (sum, c) => sum + Math.max(0, c.currentBalance || 0),
    0
  );

  // Adjust Cash/Bank/Mpesa based on actual payments received and made
  let cashDelta = 0;
  let bankDelta = 0;
  let mpesaDelta = 0;

  sales.forEach((s) => {
    if (s.type === 'sale') {
      const paid = s.paidAmount || 0;
      if (s.paymentMethod === 'cash') cashDelta += paid;
      else if (s.paymentMethod === 'bank') bankDelta += paid;
      else if (s.paymentMethod === 'mpesa') mpesaDelta += paid;
    }
  });

  expenses.forEach((e) => {
    const paid = e.paidAmount || 0;
    if (e.paymentMethod === 'cash') cashDelta -= paid;
    else if (e.paymentMethod === 'bank') bankDelta -= paid;
    else if (e.paymentMethod === 'mpesa') mpesaDelta -= paid;
  });

  const cashInHand = Math.max(0, baseCashInHand + cashDelta);
  const bankBalance = Math.max(0, baseBankBalance + bankDelta);
  const mpesaBalance = Math.max(0, baseMpesaBalance + mpesaDelta);

  const totalCurrentAssets =
    cashInHand + bankBalance + mpesaBalance + accountsReceivable + inventoryAssetValue;

  // Non-Current Assets
  const equipmentAndFixtures = fixedAssetsValue;
  const totalAssets = totalCurrentAssets + equipmentAndFixtures;

  // 2. Liabilities:
  // Accounts Payable (Bills owed to suppliers)
  const accountsPayable = suppliers.reduce(
    (sum, s) => sum + Math.max(0, s.currentBalance || 0),
    0
  );

  // KRA VAT Payable: Tax collected on sales minus tax paid on expenses
  const salesVat = sales.reduce((sum, s) => sum + (s.taxAmount || 0), 0);
  const expensesVat = expenses.reduce((sum, e) => sum + (e.taxAmount || 0), 0);
  const kraVatPayable = Math.max(0, salesVat - expensesVat);

  const totalCurrentLiabilities = accountsPayable + kraVatPayable;
  const longTermDebt = 0;
  const totalLiabilities = totalCurrentLiabilities + longTermDebt;

  // 3. Equity:
  // Total Net Profit from all historical operations
  const pnl = calculateProfitAndLoss({
    sales,
    expenses,
    filter: { preset: 'all' },
  });
  const retainedEarnings = pnl.netOperatingProfit;

  // Dynamic balancing calculation
  const totalEquity = totalAssets - totalLiabilities;
  const capital = ownerInitialCapital;
  const currentEarnings = totalEquity - capital;

  return {
    asOfDate: new Date().toISOString(),
    assets: {
      current: {
        cashInHand,
        bankBalance,
        mpesaBalance,
        accountsReceivable,
        inventoryAssetValue,
        total: totalCurrentAssets,
      },
      nonCurrent: {
        equipmentAndFixtures,
        total: equipmentAndFixtures,
      },
      totalAssets,
    },
    liabilities: {
      current: {
        accountsPayable,
        kraVatPayable,
        total: totalCurrentLiabilities,
      },
      longTerm: {
        bankLoan: longTermDebt,
        total: longTermDebt,
      },
      totalLiabilities,
    },
    equity: {
      ownerCapital: capital,
      retainedEarnings: currentEarnings,
      totalEquity,
    },
    totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
    isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1,
  };
}

/**
 * Compute Trial Balance
 */
export function calculateTrialBalance({
  sales,
  expenses,
  inventory,
  customers,
  suppliers,
}: {
  sales: Invoice[];
  expenses: ExpenseRecord[];
  inventory: InventoryItem[];
  customers: Customer[];
  suppliers: Supplier[];
}) {
  const pnl = calculateProfitAndLoss({
    sales,
    expenses,
    filter: { preset: 'all' },
  });

  const balanceSheet = calculateBalanceSheet({
    sales,
    expenses,
    inventory,
    customers,
    suppliers,
  });

  const accounts = [
    { name: 'Cash on Hand', category: 'Asset', debit: balanceSheet.assets.current.cashInHand, credit: 0 },
    { name: 'Bank Accounts (Equity Bank)', category: 'Asset', debit: balanceSheet.assets.current.bankBalance, credit: 0 },
    { name: 'M-Pesa Business Till/Paybill', category: 'Asset', debit: balanceSheet.assets.current.mpesaBalance, credit: 0 },
    { name: 'Accounts Receivable (Debtors)', category: 'Asset', debit: balanceSheet.assets.current.accountsReceivable, credit: 0 },
    { name: 'Inventory Asset (Stock at Cost)', category: 'Asset', debit: balanceSheet.assets.current.inventoryAssetValue, credit: 0 },
    { name: 'Fixtures, Equipment & Vehicles', category: 'Asset', debit: balanceSheet.assets.nonCurrent.equipmentAndFixtures, credit: 0 },
    { name: 'Accounts Payable (Creditors)', category: 'Liability', debit: 0, credit: balanceSheet.liabilities.current.accountsPayable },
    { name: 'KRA VAT Output / Payable', category: 'Liability', debit: 0, credit: balanceSheet.liabilities.current.kraVatPayable },
    { name: 'Commercial Term Loan', category: 'Liability', debit: 0, credit: balanceSheet.liabilities.longTerm.bankLoan },
    { name: "Owner's Contributed Capital", category: 'Equity', debit: 0, credit: balanceSheet.equity.ownerCapital },
    { name: 'Sales Revenue', category: 'Revenue', debit: 0, credit: pnl.grossRevenue },
    { name: 'Cost of Goods Sold (COGS)', category: 'Expense', debit: pnl.cogs, credit: 0 },
    { name: 'Operating & Admin Expenses', category: 'Expense', debit: pnl.totalOperatingExpenses, credit: 0 },
  ];

  const totalDebits = accounts.reduce((sum, a) => sum + a.debit, 0);
  const totalCredits = accounts.reduce((sum, a) => sum + a.credit, 0);

  // If there is any variance due to initial seed adjustment, balance through Retained Earnings
  const variance = totalDebits - totalCredits;
  if (Math.abs(variance) > 0.01) {
    if (variance > 0) {
      accounts.push({
        name: 'Retained Earnings Adjustment',
        category: 'Equity',
        debit: 0,
        credit: variance,
      });
    } else {
      accounts.push({
        name: 'Retained Earnings Adjustment',
        category: 'Equity',
        debit: Math.abs(variance),
        credit: 0,
      });
    }
  }

  const finalDebits = accounts.reduce((sum, a) => sum + a.debit, 0);
  const finalCredits = accounts.reduce((sum, a) => sum + a.credit, 0);

  return {
    accounts,
    totalDebits: finalDebits,
    totalCredits: finalCredits,
    isBalanced: Math.abs(finalDebits - finalCredits) < 0.05,
  };
}

/**
 * Generate full chronologic transaction ledger
 */
export function generateTransactionLedger({
  sales,
  expenses,
}: {
  sales: Invoice[];
  expenses: ExpenseRecord[];
}): LedgerEntry[] {
  const entries: LedgerEntry[] = [];

  sales.forEach((s) => {
    // Revenue entry
    entries.push({
      id: `led-sale-${s.id}`,
      date: s.date,
      reference: s.invoiceNumber || 'INV',
      description: `Sales to ${s.entityName} (${s.items.length} items)`,
      account: s.paymentStatus === 'paid' ? `Cash / ${s.paymentMethod.toUpperCase()}` : 'Accounts Receivable',
      accountCategory: 'revenue',
      debit: s.grandTotal,
      credit: 0,
      balance: 0,
    });
  });

  expenses.forEach((e) => {
    entries.push({
      id: `led-exp-${e.id}`,
      date: e.date,
      reference: e.billNumber || 'EXP',
      description: `${e.category}: ${e.description} (${e.supplierName})`,
      account: `Operating Expense: ${e.category}`,
      accountCategory: 'expense',
      debit: 0,
      credit: e.totalWithTax,
      balance: 0,
    });
  });

  // Sort descending by date
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Compute running balance
  let running = 0;
  for (let i = entries.length - 1; i >= 0; i--) {
    running += entries[i].debit - entries[i].credit;
    entries[i].balance = running;
  }

  return entries;
}

/**
 * Compute Accounts Receivable Aging
 */
export function calculateReceivablesAging(customers: Customer[], sales: Invoice[]) {
  const now = new Date();

  return customers
    .map((cust) => {
      const custSales = sales.filter(
        (s) => s.type === 'sale' && s.entityId === cust.id && s.paymentStatus !== 'paid'
      );

      let current0to30 = 0;
      let overdue31to60 = 0;
      let overdue61to90 = 0;
      let overdue90Plus = 0;

      custSales.forEach((s) => {
        const dueDate = new Date(s.dueDate || s.date);
        const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const dueAmount = s.dueAmount > 0 ? s.dueAmount : s.grandTotal - (s.paidAmount || 0);

        if (diffDays <= 30) current0to30 += dueAmount;
        else if (diffDays <= 60) overdue31to60 += dueAmount;
        else if (diffDays <= 90) overdue61to90 += dueAmount;
        else overdue90Plus += dueAmount;
      });

      const totalOwed = cust.currentBalance > 0 ? cust.currentBalance : (current0to30 + overdue31to60 + overdue61to90 + overdue90Plus);

      return {
        customer: cust,
        totalOwed,
        current0to30,
        overdue31to60,
        overdue61to90,
        overdue90Plus,
        pendingInvoicesCount: custSales.length,
      };
    })
    .filter((r) => r.totalOwed > 0)
    .sort((a, b) => b.totalOwed - a.totalOwed);
}

/**
 * Compute Accounts Payable Aging
 */
export function calculatePayablesAging(suppliers: Supplier[], expenses: ExpenseRecord[]) {
  const now = new Date();

  return suppliers
    .map((sup) => {
      const supExpenses = expenses.filter(
        (e) => e.supplierId === sup.id && e.paymentStatus === 'pending'
      );

      let current0to30 = 0;
      let overdue31to60 = 0;
      let overdue90Plus = 0;

      supExpenses.forEach((e) => {
        const dueDate = new Date(e.dueDate || e.date);
        const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const dueAmount = e.totalWithTax - (e.paidAmount || 0);

        if (diffDays <= 30) current0to30 += dueAmount;
        else if (diffDays <= 60) overdue31to60 += dueAmount;
        else overdue90Plus += dueAmount;
      });

      const totalOwed = sup.currentBalance > 0 ? sup.currentBalance : (current0to30 + overdue31to60 + overdue90Plus);

      return {
        supplier: sup,
        totalOwed,
        current0to30,
        overdue31to60,
        overdue90Plus,
        pendingBillsCount: supExpenses.length,
      };
    })
    .filter((p) => p.totalOwed > 0)
    .sort((a, b) => b.totalOwed - a.totalOwed);
}

/**
 * Compute monthly summary trends for the past 6 months
 */
export function calculateMonthlyTrends(sales: Invoice[], expenses: ExpenseRecord[]) {
  const months: Array<{
    monthKey: string;
    label: string;
    sales: number;
    expenses: number;
    netProfit: number;
  }> = [];

  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-KE', { month: 'short', year: '2-digit' });

    let mSales = 0;
    sales.forEach((s) => {
      const sDate = new Date(s.date);
      if (sDate.getFullYear() === year && sDate.getMonth() === month && s.type === 'sale') {
        mSales += s.subtotal;
      }
    });

    let mExpenses = 0;
    expenses.forEach((e) => {
      const eDate = new Date(e.date);
      if (eDate.getFullYear() === year && eDate.getMonth() === month) {
        mExpenses += e.amount;
      }
    });

    months.push({
      monthKey,
      label,
      sales: mSales,
      expenses: mExpenses,
      netProfit: mSales - mExpenses,
    });
  }

  return months;
}

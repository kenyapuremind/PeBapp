/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { X, Receipt, CheckCircle, Percent, DollarSign, Plus, Trash2, Package, Boxes, AlertCircle } from 'lucide-react';
import { ExpenseItemLine, ExpenseRecord, InventoryItem, PaymentMethod, StockMovement, Supplier, TaxMode, User } from '../types';
import { formatKES } from '../utils/formatters';

interface CreateExpenseModalProps {
  suppliers: Supplier[];
  inventory: InventoryItem[];
  currentUser: User;
  onClose: () => void;
  onSave: (
    expense: ExpenseRecord,
    updatedSuppliers: Supplier[],
    restockMovements?: StockMovement[],
    updatedInventory?: InventoryItem[]
  ) => void;
  onQuickAddSupplier: (supplier: Supplier) => void;
}

const EXPENSE_CATEGORIES: Array<ExpenseRecord['category']> = [
  'Inventory Purchase',
  'Rent',
  'Utilities',
  'Salaries & Wages',
  'Fuel & Transport',
  'Marketing & Ads',
  'Repairs & Maintenance',
  'Taxes & Licenses',
  'Internet & Communication',
  'Office Supplies',
  'Miscellaneous',
];

export const CreateExpenseModal: React.FC<CreateExpenseModalProps> = ({
  suppliers,
  inventory,
  currentUser,
  onClose,
  onSave,
  onQuickAddSupplier,
}) => {
  const [category, setCategory] = useState<ExpenseRecord['category']>('Inventory Purchase');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [isAdHocVendor, setIsAdHocVendor] = useState(suppliers.length === 0);
  const [vendorName, setVendorName] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [taxRatePercent, setTaxRatePercent] = useState<number>(16);
  const [taxMode, setTaxMode] = useState<TaxMode>('inclusive');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('paid');
  const [mpesaCode, setMpesaCode] = useState('');
  const [notes, setNotes] = useState('');

  // Restock inventory line items
  const productItems = inventory.filter((i) => i.type === 'product');
  const [restockLines, setRestockLines] = useState<Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    unitCost: number;
    unit: string;
    lineTotal: number;
  }>>([
    {
      itemId: productItems[0]?.id || '',
      itemName: productItems[0]?.name || '',
      quantity: 10,
      unitCost: productItems[0]?.costPrice || 500,
      unit: productItems[0]?.unit || 'Pcs',
      lineTotal: (productItems[0]?.costPrice || 500) * 10,
    },
  ]);

  const isInventoryPurchase = category === 'Inventory Purchase';

  // Automatically sync base amount when restock line items change
  useEffect(() => {
    if (isInventoryPurchase && restockLines.length > 0) {
      const sum = restockLines.reduce((acc, l) => acc + (l.quantity * l.unitCost), 0);
      setAmount(sum);
    }
  }, [isInventoryPurchase, restockLines]);

  const handleAddRestockLine = () => {
    const nextItem = productItems[0];
    const newLine = {
      itemId: nextItem?.id || '',
      itemName: nextItem?.name || '',
      quantity: 1,
      unitCost: nextItem?.costPrice || 100,
      unit: nextItem?.unit || 'Pcs',
      lineTotal: (nextItem?.costPrice || 100) * 1,
    };
    setRestockLines([...restockLines, newLine]);
  };

  const handleUpdateRestockLine = (index: number, field: string, val: any) => {
    setRestockLines((prev) => {
      const updated = [...prev];
      const cur = { ...updated[index], [field]: val };

      if (field === 'itemId') {
        const found = productItems.find((p) => p.id === val);
        if (found) {
          cur.itemName = found.name;
          cur.unitCost = found.costPrice;
          cur.unit = found.unit;
        }
      }

      cur.lineTotal = (Number(cur.quantity) || 0) * (Number(cur.unitCost) || 0);
      updated[index] = cur;
      return updated;
    });
  };

  const handleRemoveRestockLine = (index: number) => {
    if (restockLines.length === 1) {
      alert('Keep at least one restock line item, or switch category.');
      return;
    }
    setRestockLines(restockLines.filter((_, i) => i !== index));
  };

  // Calculate tax amount and total
  const rate = Math.max(0, taxRatePercent) / 100;
  let taxAmount = 0;
  let totalWithTax = amount;

  if (taxMode === 'exclusive') {
    taxAmount = amount * rate;
    totalWithTax = amount + taxAmount;
  } else {
    // Inclusive
    totalWithTax = amount;
    const base = amount / (1 + rate);
    taxAmount = amount - base;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Please enter a valid expense amount or add restock line items.');
      return;
    }

    let targetSupplierId = selectedSupplierId;
    let targetSupplierName = '';
    let updatedSuppliers = [...suppliers];

    if (isAdHocVendor) {
      targetSupplierName = vendorName.trim() || 'General Vendor';
      if (vendorName.trim()) {
        const newSup: Supplier = {
          id: `sup-${Date.now()}`,
          name: targetSupplierName,
          phone: vendorPhone.trim(),
          email: '',
          currentBalance: paymentStatus === 'pending' ? totalWithTax : 0,
          createdAt: new Date().toISOString(),
        };
        targetSupplierId = newSup.id;
        updatedSuppliers.push(newSup);
        onQuickAddSupplier(newSup);
      }
    } else {
      const found = suppliers.find((s) => s.id === selectedSupplierId);
      if (found) {
        targetSupplierName = found.name;
        if (paymentStatus === 'pending') {
          updatedSuppliers = updatedSuppliers.map((s) => {
            if (s.id === found.id) {
              return { ...s, currentBalance: s.currentBalance + totalWithTax };
            }
            return s;
          });
        }
      }
    }

    const billNumber = `BIL-${Date.now().toString().slice(-6)}`;

    // Prepare restock payload and movements if category is Inventory Purchase
    const restockMovements: StockMovement[] = [];
    let updatedInventoryList = [...inventory];

    const expenseRestockItems: ExpenseItemLine[] = [];

    if (isInventoryPurchase) {
      restockLines.forEach((line) => {
        if (!line.itemName.trim() || line.quantity <= 0) return;

        let itemId = line.itemId;
        let matched = updatedInventoryList.find((i) => i.id === itemId);

        // If user typed a custom new product name on the fly
        if (!matched && line.itemName.trim()) {
          matched = updatedInventoryList.find((i) => i.name.toLowerCase() === line.itemName.toLowerCase());
          if (!matched) {
            const newCreatedItem: InventoryItem = {
              id: `itm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              name: line.itemName.trim(),
              sku: `PRD-${Date.now().toString().slice(-4)}`,
              type: 'product',
              category: 'General Goods',
              unit: line.unit || 'Pcs',
              costPrice: line.unitCost,
              sellingPrice: Math.round(line.unitCost * 1.3),
              currentStock: 0,
              reorderLevel: 5,
              isActive: true,
              createdAt: new Date().toISOString(),
            };
            updatedInventoryList.push(newCreatedItem);
            matched = newCreatedItem;
            itemId = newCreatedItem.id;
          }
        }

        if (matched) {
          const prev = matched.currentStock;
          const newStock = prev + line.quantity;

          // Update stock and cost price
          updatedInventoryList = updatedInventoryList.map((i) =>
            i.id === matched!.id
              ? {
                  ...i,
                  currentStock: newStock,
                  costPrice: line.unitCost > 0 ? line.unitCost : i.costPrice,
                }
              : i
          );

          restockMovements.push({
            id: `mov-${Date.now()}-${matched.id}`,
            itemId: matched.id,
            itemName: matched.name,
            type: 'inward_purchase',
            quantity: line.quantity,
            previousStock: prev,
            newStock,
            unitCost: line.unitCost,
            reference: billNumber,
            notes: `Restocked via Expense Bill ${billNumber} (${targetSupplierName || 'Vendor'})`,
            date: new Date(date).toISOString(),
            createdBy: currentUser.name,
          });

          expenseRestockItems.push({
            itemId: matched.id,
            itemName: matched.name,
            quantity: line.quantity,
            unitCost: line.unitCost,
            unit: matched.unit,
            lineTotal: line.quantity * line.unitCost,
          });
        }
      });
    }

    const defaultDesc = isInventoryPurchase && expenseRestockItems.length > 0
      ? `Inventory Stock Purchase: ${expenseRestockItems.map((l) => `${l.quantity}x ${l.itemName}`).join(', ')}`
      : `${category} payment`;

    const newExpense: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      billNumber,
      supplierId: targetSupplierId,
      supplierName: targetSupplierName || 'Vendor',
      category,
      date: new Date(date).toISOString(),
      dueDate: paymentStatus === 'pending' ? new Date(dueDate).toISOString() : undefined,
      description: description.trim() || defaultDesc,
      amount,
      taxRatePercent,
      taxMode,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalWithTax: Math.round(totalWithTax * 100) / 100,
      paymentMethod,
      paymentStatus,
      paidAmount: paymentStatus === 'paid' ? totalWithTax : 0,
      mpesaCode: mpesaCode.trim().toUpperCase() || undefined,
      notes: notes.trim(),
      restockItems: expenseRestockItems.length > 0 ? expenseRestockItems : undefined,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    onSave(newExpense, updatedSuppliers, restockMovements, updatedInventoryList);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[95vh]">
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              Record Expense / Inventory Purchase
            </h3>
            <p className="text-xs text-slate-400">Track operating costs, utility bills, and restock warehouse items</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 font-semibold text-emerald-950"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'Inventory Purchase' ? '📦 Inventory Purchase (Restock Stock)' : cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          {/* Supplier or Payee */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Vendor / Payee</label>
              <button
                type="button"
                onClick={() => setIsAdHocVendor(!isAdHocVendor)}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
              >
                {isAdHocVendor ? (suppliers.length > 0 ? '← Select Registered Supplier' : '+ Custom Vendor') : '+ Custom Vendor / Payee'}
              </button>
            </div>

            {isAdHocVendor || suppliers.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Vendor Name (e.g. Bamburi Ltd, Shell, Landlord) *"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300"
                />
                <input
                  type="tel"
                  placeholder="Contact / Phone / Till (Optional)"
                  value={vendorPhone}
                  onChange={(e) => setVendorPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 font-mono"
                />
              </div>
            ) : (
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 font-medium text-slate-800"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.currentBalance > 0 ? `(We owe ${formatKES(s.currentBalance)})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Dedicated Inventory Restock Table when category is Inventory Purchase */}
          {isInventoryPurchase && (
            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-emerald-700" />
                    Select Stock Items to Restock
                  </h4>
                  <p className="text-[11px] text-emerald-700">
                    Stock quantities will be increased and recorded in stock movement ledger upon saving.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddRestockLine}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {restockLines.map((line, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                  >
                    {/* Item Selector or Custom Item Input */}
                    <div className="sm:col-span-5">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                        Product Item to Restock
                      </label>
                      {productItems.length > 0 ? (
                        <div className="space-y-1">
                          <select
                            value={line.itemId}
                            onChange={(e) => handleUpdateRestockLine(idx, 'itemId', e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-300 font-medium text-slate-900"
                          >
                            <option value="">-- Choose registered product --</option>
                            {productItems.map((prod) => (
                              <option key={prod.id} value={prod.id}>
                                {prod.name} (Current: {prod.currentStock} {prod.unit})
                              </option>
                            ))}
                          </select>
                          {!line.itemId && (
                            <input
                              type="text"
                              placeholder="Or type custom product name..."
                              value={line.itemName}
                              onChange={(e) => handleUpdateRestockLine(idx, 'itemName', e.target.value)}
                              className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded-md"
                            />
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          required
                          placeholder="Product Name (e.g. Cement 50kg, Maize Seed)..."
                          value={line.itemName}
                          onChange={(e) => handleUpdateRestockLine(idx, 'itemName', e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 font-medium"
                        />
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                        Restock Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={line.quantity}
                        onChange={(e) => handleUpdateRestockLine(idx, 'quantity', Math.max(1, Number(e.target.value)))}
                        className="w-full text-xs px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-300 font-mono font-bold"
                      />
                    </div>

                    {/* Unit Cost */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                        Unit Cost (KES)
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={line.unitCost}
                        onChange={(e) => handleUpdateRestockLine(idx, 'unitCost', Number(e.target.value))}
                        className="w-full text-xs px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-300 font-mono"
                      />
                    </div>

                    {/* Line Total */}
                    <div className="sm:col-span-2 text-right">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                        Line Total
                      </label>
                      <div className="text-xs font-bold font-mono text-emerald-800 pt-1">
                        {formatKES(line.lineTotal)}
                      </div>
                    </div>

                    {/* Remove Action */}
                    <div className="sm:col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveRestockLine(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Remove line"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center text-xs font-bold text-emerald-950 pt-2 border-t border-emerald-200">
                <span>Total Restock Items Subtotal:</span>
                <span className="font-mono text-sm">{formatKES(amount)}</span>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Bill Memo *</label>
            <input
              type="text"
              required
              placeholder={isInventoryPurchase ? 'e.g. Purchase of stock replenishment from supplier' : 'e.g. Showroom rent, Diesel fuel, Electricity tokens'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300"
            />
          </div>

          {/* Amount, Tax Rate & Tax Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isInventoryPurchase ? 'Base Amount (Sum of Lines)' : 'Base Amount (KES) *'}
              </label>
              <input
                type="number"
                min="1"
                required
                readOnly={isInventoryPurchase && restockLines.length > 0}
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="0.00"
                className={`w-full text-xs px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold ${
                  isInventoryPurchase ? 'bg-slate-100 text-slate-700' : 'bg-slate-50 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">VAT Rate (%)</label>
              <div className="flex gap-1 items-center">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxRatePercent}
                  onChange={(e) => setTaxRatePercent(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 font-mono"
                />
                <span className="text-xs font-bold text-slate-500">%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">VAT Inclusion</label>
              <select
                value={taxMode}
                onChange={(e) => setTaxMode(e.target.value as any)}
                className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300"
              >
                <option value="inclusive">Inclusive (Amount has VAT)</option>
                <option value="exclusive">Exclusive (Add VAT on top)</option>
              </select>
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 font-medium"
              >
                <option value="paid">Paid Now</option>
                <option value="pending">Supplier Credit (Payable later)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 font-medium"
              >
                <option value="mpesa">M-Pesa</option>
                <option value="bank">Bank Transfer / Cheque</option>
                <option value="cash">Cash</option>
                <option value="credit">Credit / Account</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {paymentMethod === 'mpesa' ? 'M-Pesa Code' : 'Ref / Cheque #'}
              </label>
              <input
                type="text"
                placeholder={paymentMethod === 'mpesa' ? 'e.g. QK8912J4K' : 'e.g. CHQ-0012'}
                value={mpesaCode}
                onChange={(e) => setMpesaCode(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 font-mono uppercase"
              />
            </div>
          </div>

          {paymentStatus === 'pending' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bill Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Approved invoice by director, batch number #401"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300"
            />
          </div>

          {/* Total Calculation Strip */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-600">Calculated VAT: </span>
              <strong className="font-mono">{formatKES(taxAmount)}</strong>
            </div>
            <div>
              <span className="text-slate-700 font-bold">Total Expense: </span>
              <strong className="font-mono text-emerald-800 text-sm font-bold">{formatKES(totalWithTax)}</strong>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isInventoryPurchase ? 'Record Expense & Restock Stock' : 'Record Expense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  DollarSign,
  User as UserIcon,
  ShoppingBag,
  Percent,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  BusinessProfile,
  Customer,
  InventoryItem,
  Invoice,
  InvoiceLineItem,
  PaymentMethod,
  PaymentStatus,
  StockMovement,
  TaxMode,
  User,
} from '../types';
import { calculateLineTax, formatKES } from '../utils/formatters';

interface CreateInvoiceModalProps {
  business: BusinessProfile;
  customers: Customer[];
  inventory: InventoryItem[];
  currentUser: User;
  onClose: () => void;
  onSave: (invoice: Invoice, movements: StockMovement[], updatedCustomers: Customer[], updatedInventory: InventoryItem[]) => void;
  onQuickAddCustomer: (customer: Customer) => void;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  business,
  customers,
  inventory,
  currentUser,
  onClose,
  onSave,
  onQuickAddCustomer,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [isNewCustomer, setIsNewCustomer] = useState(customers.length === 0);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerKraPin, setNewCustomerKraPin] = useState('');

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });

  const [taxRatePercent, setTaxRatePercent] = useState<number>(business.defaultTaxRate ?? 16);
  const [taxMode, setTaxMode] = useState<TaxMode>(business.defaultTaxMode ?? 'exclusive');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [mpesaCode, setMpesaCode] = useState('');
  const [notes, setNotes] = useState('');

  // Line items state
  const [items, setItems] = useState<InvoiceLineItem[]>([
    {
      itemId: inventory[0]?.id || '',
      name: inventory[0]?.name || '',
      type: inventory[0]?.type || 'product',
      quantity: 1,
      unitPrice: inventory[0]?.sellingPrice || 1000,
      costPrice: inventory[0]?.costPrice || 800,
      unit: inventory[0]?.unit || 'Pcs',
      discountPercent: 0,
      taxRatePercent: business.defaultTaxRate ?? 16,
      taxAmount: 0,
      lineTotal: 0,
    },
  ]);

  // Recalculate line totals on each edit
  const computedItems = items.map((item) => {
    const calc = calculateLineTax({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountPercent: item.discountPercent,
      taxRatePercent: taxRatePercent,
      taxMode: taxMode,
    });
    return {
      ...item,
      taxRatePercent: taxRatePercent,
      taxAmount: calc.taxAmount,
      lineTotal: calc.lineTotal,
    };
  });

  const subtotal = computedItems.reduce((sum, i) => {
    const calc = calculateLineTax({
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      discountPercent: i.discountPercent,
      taxRatePercent: taxRatePercent,
      taxMode: taxMode,
    });
    return sum + calc.subtotal;
  }, 0);

  const discountTotal = computedItems.reduce((sum, i) => {
    const calc = calculateLineTax({
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      discountPercent: i.discountPercent,
      taxRatePercent: taxRatePercent,
      taxMode: taxMode,
    });
    return sum + calc.discountAmount;
  }, 0);

  const totalTax = computedItems.reduce((sum, i) => sum + i.taxAmount, 0);
  const grandTotal = computedItems.reduce((sum, i) => sum + i.lineTotal, 0);

  const [paidAmount, setPaidAmount] = useState<number>(grandTotal);

  // Sync paidAmount when grandTotal changes if status is 'paid'
  React.useEffect(() => {
    if (paymentStatus === 'paid') {
      setPaidAmount(grandTotal);
    } else if (paymentStatus === 'unpaid') {
      setPaidAmount(0);
    }
  }, [grandTotal, paymentStatus]);

  const dueAmount = Math.max(0, grandTotal - paidAmount);

  const handleAddItem = () => {
    const defaultInv = inventory[0];
    setItems([
      ...items,
      {
        itemId: defaultInv?.id || '',
        name: defaultInv?.name || 'Custom Item',
        type: defaultInv?.type || 'product',
        quantity: 1,
        unitPrice: defaultInv?.sellingPrice || 1000,
        costPrice: defaultInv?.costPrice || 800,
        unit: defaultInv?.unit || 'Pcs',
        discountPercent: 0,
        taxRatePercent: taxRatePercent,
        taxAmount: 0,
        lineTotal: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemSelect = (index: number, itemId: string) => {
    const found = inventory.find((i) => i.id === itemId);
    if (!found) return;
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      itemId: found.id,
      name: found.name,
      type: found.type,
      unitPrice: found.sellingPrice,
      costPrice: found.costPrice,
      unit: found.unit,
    };
    setItems(newItems);
  };

  const handleUpdateItemProp = (index: number, field: keyof InvoiceLineItem, val: any) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: val,
    };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let targetCustomerId = selectedCustomerId;
    let targetCustomerName = '';
    let targetCustomerPhone = '';
    let targetCustomerEmail = '';
    let targetCustomerKraPin = '';
    let updatedCustomerList = [...customers];

    if (isNewCustomer) {
      if (!newCustomerName.trim()) {
        alert('Please enter a customer name.');
        return;
      }
      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim(),
        email: newCustomerEmail.trim(),
        kraPin: newCustomerKraPin.trim(),
        creditLimit: 100000,
        currentBalance: 0,
        createdAt: new Date().toISOString(),
      };
      targetCustomerId = newCust.id;
      targetCustomerName = newCust.name;
      targetCustomerPhone = newCust.phone;
      targetCustomerEmail = newCust.email;
      targetCustomerKraPin = newCust.kraPin || '';
      updatedCustomerList.push(newCust);
      onQuickAddCustomer(newCust);
    } else {
      const existing = customers.find((c) => c.id === selectedCustomerId);
      if (existing) {
        targetCustomerName = existing.name;
        targetCustomerPhone = existing.phone;
        targetCustomerEmail = existing.email;
        targetCustomerKraPin = existing.kraPin || '';
      }
    }

    // Prepare Invoice
    const invoiceNumber = `${business.invoicePrefix}${String(Date.now()).slice(-5)}`;
    const receiptNumber = `${business.receiptPrefix}${String(Date.now()).slice(-5)}`;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      type: 'sale',
      invoiceNumber,
      receiptNumber: paymentStatus === 'paid' ? receiptNumber : undefined,
      entityId: targetCustomerId,
      entityName: targetCustomerName,
      entityPhone: targetCustomerPhone,
      entityEmail: targetCustomerEmail,
      entityKraPin: targetCustomerKraPin,
      date: new Date(date).toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      items: computedItems,
      subtotal,
      discountTotal,
      taxRatePercent,
      taxMode,
      taxAmount: totalTax,
      grandTotal,
      paidAmount,
      dueAmount,
      paymentStatus,
      paymentMethod,
      mpesaCode: mpesaCode.trim().toUpperCase() || undefined,
      notes: notes.trim(),
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    // If there is an unpaid balance, increase customer balance
    if (dueAmount > 0) {
      updatedCustomerList = updatedCustomerList.map((c) => {
        if (c.id === targetCustomerId) {
          return {
            ...c,
            currentBalance: c.currentBalance + dueAmount,
          };
        }
        return c;
      });
    }

    // Deduct stock for product line items and generate stock movement log
    const stockMovements: StockMovement[] = [];
    const updatedInventoryList = inventory.map((invItem) => {
      const match = computedItems.find((i) => i.itemId === invItem.id && i.type === 'product');
      if (match) {
        const prev = invItem.currentStock;
        const newStock = Math.max(0, prev - match.quantity);
        stockMovements.push({
          id: `mov-${Date.now()}-${invItem.id}`,
          itemId: invItem.id,
          itemName: invItem.name,
          type: 'outward_sale',
          quantity: match.quantity,
          previousStock: prev,
          newStock,
          unitCost: invItem.costPrice,
          reference: invoiceNumber,
          notes: `Sold to ${targetCustomerName}`,
          date: new Date().toISOString(),
          createdBy: currentUser.name,
        });
        return {
          ...invItem,
          currentStock: newStock,
        };
      }
      return invItem;
    });

    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#059669', '#10B981', '#34D399', '#F59E0B'],
      });
    } catch {
      // ignore
    }

    onSave(newInvoice, stockMovements, updatedCustomerList, updatedInventoryList);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              New Sale / Tax Invoice & Receipt
            </h3>
            <p className="text-xs text-slate-400">Issue direct receipt or credit invoice with editable VAT</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-6">
          
          {/* Section 1: Customer & Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {/* Customer selector */}
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Customer</label>
                <button
                  type="button"
                  onClick={() => setIsNewCustomer(!isNewCustomer)}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                >
                  {isNewCustomer ? '← Choose Existing Customer' : '+ Add New Customer'}
                </button>
              </div>

              {isNewCustomer ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Customer / Company Name *"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="tel"
                    placeholder="Phone (e.g. 0722000000)"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={newCustomerEmail}
                    onChange={(e) => setNewCustomerEmail(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="KRA PIN (Optional e.g. P051...)"
                    value={newCustomerKraPin}
                    onChange={(e) => setNewCustomerKraPin(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 uppercase font-mono"
                  />
                </div>
              ) : (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.currentBalance > 0 ? `(Owes ${formatKES(c.currentBalance)})` : ''} · {c.phone}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Dates */}
            <div className="space-y-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Invoice Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {paymentStatus !== 'paid' && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Products & Services Line Items
              </h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {computedItems.map((item, idx) => {
                const invItem = inventory.find((i) => i.id === item.itemId);
                const isOutOfStock = invItem && invItem.type === 'product' && invItem.currentStock < item.quantity;

                return (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                  >
                    {/* Item selector */}
                    <div className="sm:col-span-5">
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                        Select Item
                      </label>
                      {inventory.length > 0 ? (
                        <select
                          value={item.itemId}
                          onChange={(e) => handleItemSelect(idx, e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-300 font-medium text-slate-900"
                        >
                          <option value="">-- Choose registered item --</option>
                          {inventory.map((inv) => (
                            <option key={inv.id} value={inv.id}>
                              {inv.name} ({inv.type === 'service' ? 'Service' : `Stock: ${inv.currentStock} ${inv.unit}`}) - {formatKES(inv.sellingPrice)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          required
                          placeholder="Product or Service Name (e.g. Consulting, Cement)..."
                          value={item.name}
                          onChange={(e) => handleUpdateItemProp(idx, 'name', e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 font-medium"
                        />
                      )}
                      {isOutOfStock && (
                        <p className="text-[10px] text-amber-600 font-medium mt-0.5 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Order quantity exceeds current on-hand stock ({invItem.currentStock} {invItem.unit})</span>
                        </p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                        Qty ({item.unit || 'Unit'})
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItemProp(idx, 'quantity', Math.max(1, Number(e.target.value)))}
                        className="w-full text-xs px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-300 font-mono tabular-nums"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                        Price (KES)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => handleUpdateItemProp(idx, 'unitPrice', Number(e.target.value))}
                        className="w-full text-xs px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-300 font-mono tabular-nums"
                      />
                    </div>

                    {/* Discount % */}
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                        Disc %
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discountPercent}
                        onChange={(e) => handleUpdateItemProp(idx, 'discountPercent', Number(e.target.value))}
                        className="w-full text-xs px-2 py-1.5 bg-slate-50 rounded-lg border border-slate-300 font-mono tabular-nums"
                      />
                    </div>

                    {/* Line Total & Remove */}
                    <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 text-right">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-semibold uppercase">Total</span>
                        <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                          {formatKES(item.lineTotal)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length <= 1}
                        className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 ml-2"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Tax Settings & Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-200">
            {/* Tax Settings */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-emerald-600" />
                Invoice Tax Configuration (KRA VAT)
              </h5>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">VAT Rate (%)</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={taxRatePercent}
                      onChange={(e) => setTaxRatePercent(Number(e.target.value))}
                      className="w-full text-xs px-3 py-1.5 bg-white rounded-lg border border-slate-300 font-mono font-bold text-slate-900"
                    />
                    <span className="text-xs font-bold text-slate-500">%</span>
                  </div>
                  <div className="flex gap-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setTaxRatePercent(16)}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                        taxRatePercent === 16 ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      16% Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaxRatePercent(0)}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                        taxRatePercent === 0 ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      0% Exempt
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaxRatePercent(8)}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                        taxRatePercent === 8 ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      8% Fuel
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Tax Calculation</label>
                  <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-200 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setTaxMode('exclusive')}
                      className={`text-xs py-1.5 px-2 rounded-md font-medium transition-colors ${
                        taxMode === 'exclusive' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Exclusive
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaxMode('inclusive')}
                      className={`text-xs py-1.5 px-2 rounded-md font-medium transition-colors ${
                        taxMode === 'inclusive' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Inclusive
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {taxMode === 'exclusive'
                      ? 'Tax added onto prices at checkout'
                      : 'Prices entered already include VAT'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Invoice Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Delivery terms, Purchase Order ref #, warranty info"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-white rounded-lg border border-slate-300"
                />
              </div>
            </div>

            {/* Payment & Totals */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Payment & Terms
              </h5>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full text-xs px-3 py-1.5 bg-white rounded-lg border border-slate-300 font-medium"
                  >
                    <option value="paid">Paid in Full (Issue Receipt)</option>
                    <option value="partial">Partial Payment</option>
                    <option value="unpaid">Credit Invoice (Unpaid)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full text-xs px-3 py-1.5 bg-white rounded-lg border border-slate-300 font-medium"
                  >
                    <option value="mpesa">M-Pesa</option>
                    <option value="cash">Cash in Hand</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="credit">Customer Credit / Account</option>
                  </select>
                </div>
              </div>

              {paymentMethod === 'mpesa' && paymentStatus !== 'unpaid' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    M-Pesa Transaction Ref Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RFT9923K4A"
                    value={mpesaCode}
                    onChange={(e) => setMpesaCode(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 bg-white rounded-lg border border-slate-300 font-mono uppercase"
                  />
                </div>
              )}

              {paymentStatus === 'partial' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Amount Paid Today (KES)</label>
                  <input
                    type="number"
                    min="0"
                    max={grandTotal}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full text-xs px-3 py-1.5 bg-white rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              )}

              {/* Financial Totals Summary */}
              <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono tabular-nums">{formatKES(subtotal)}</span>
                </div>
                {discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span className="font-mono tabular-nums">- {formatKES(discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>VAT ({taxRatePercent}% {taxMode}):</span>
                  <span className="font-mono tabular-nums">{formatKES(totalTax)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-300">
                  <span>Grand Total:</span>
                  <span className="font-mono tabular-nums text-emerald-800">{formatKES(grandTotal)}</span>
                </div>
                {paymentStatus !== 'paid' && (
                  <div className="flex justify-between text-xs font-semibold text-rose-600">
                    <span>Balance Due:</span>
                    <span className="font-mono tabular-nums">{formatKES(dueAmount)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-transform active:scale-[0.98]"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{paymentStatus === 'paid' ? 'Generate & Print Receipt' : 'Save & Issue Invoice'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

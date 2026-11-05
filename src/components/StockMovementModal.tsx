/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { InventoryItem, MovementType, StockMovement, User } from '../types';

interface StockMovementModalProps {
  inventory: InventoryItem[];
  preselectedItem?: InventoryItem;
  currentUser: User;
  onClose: () => void;
  onSave: (movement: StockMovement, updatedInventory: InventoryItem[]) => void;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  inventory,
  preselectedItem,
  currentUser,
  onClose,
  onSave,
}) => {
  const products = inventory.filter((i) => i.type === 'product');
  const [selectedItemId, setSelectedItemId] = useState<string>(preselectedItem?.id || products[0]?.id || '');
  const [movementType, setMovementType] = useState<MovementType>('inward_purchase');
  const [quantity, setQuantity] = useState<number>(10);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const currentItem = products.find((p) => p.id === selectedItemId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem || quantity <= 0) return;

    let newStock = currentItem.currentStock;
    if (movementType === 'inward_purchase' || movementType === 'adjustment_return') {
      newStock += quantity;
    } else if (movementType === 'outward_sale' || movementType === 'adjustment_damaged') {
      newStock = Math.max(0, newStock - quantity);
    } else if (movementType === 'adjustment_count') {
      newStock = quantity; // Physical count sets exact inventory
    }

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      itemId: currentItem.id,
      itemName: currentItem.name,
      type: movementType,
      quantity,
      previousStock: currentItem.currentStock,
      newStock,
      unitCost: currentItem.costPrice,
      reference: reference.trim() || undefined,
      notes: notes.trim() || undefined,
      date: new Date().toISOString(),
      createdBy: currentUser.name,
    };

    const updatedList = inventory.map((inv) => (inv.id === currentItem.id ? { ...inv, currentStock: newStock } : inv));
    onSave(movement, updatedList);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              Stock Restock & Movement
            </h3>
            <p className="text-xs text-slate-400">Record inward inventory, damaged write-offs, or stock take</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {products.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-800">No products registered in inventory</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Please register your first product in the Stock Inventory module before recording stock movements or restocks.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Product *</label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 font-medium"
              >
                {products.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · (On Hand: {item.currentStock} {item.unit})
                  </option>
                ))}
              </select>
            </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Movement Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMovementType('inward_purchase')}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-semibold text-left transition-colors ${
                  movementType === 'inward_purchase'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                <div>
                  <div>Inward Restock</div>
                  <div className="text-[10px] font-normal text-slate-500">Purchased from supplier</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMovementType('adjustment_damaged')}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-semibold text-left transition-colors ${
                  movementType === 'adjustment_damaged'
                    ? 'border-rose-600 bg-rose-50 text-rose-800'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <div>
                  <div>Damage / Loss</div>
                  <div className="text-[10px] font-normal text-slate-500">Write-off spoiled stock</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMovementType('adjustment_return')}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-semibold text-left transition-colors ${
                  movementType === 'adjustment_return'
                    ? 'border-blue-600 bg-blue-50 text-blue-800'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-blue-600" />
                <div>
                  <div>Customer Return</div>
                  <div className="text-[10px] font-normal text-slate-500">Add back to shelf</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMovementType('adjustment_count')}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-semibold text-left transition-colors ${
                  movementType === 'adjustment_count'
                    ? 'border-purple-600 bg-purple-50 text-purple-800'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Package className="w-4 h-4 text-purple-600" />
                <div>
                  <div>Physical Audit Count</div>
                  <div className="text-[10px] font-normal text-slate-500">Reset to verified quantity</div>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {movementType === 'adjustment_count' ? 'Actual Count Quantity *' : 'Quantity to Move *'}
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Doc Reference / PO #</label>
              <input
                type="text"
                placeholder="e.g. PO-8921, Delivery Note 4"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Notes / Reason</label>
            <input
              type="text"
              placeholder="e.g. Received shipment from Kenya Seed Depot"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300"
            />
          </div>

          {currentItem && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
              <div>
                <span className="text-slate-500">Current Stock: </span>
                <span className="font-mono font-semibold">{currentItem.currentStock} {currentItem.unit}</span>
              </div>
              <div>
                <span className="text-slate-500">Resulting Stock: </span>
                <span className="font-mono font-bold text-emerald-700">
                  {movementType === 'inward_purchase' || movementType === 'adjustment_return'
                    ? currentItem.currentStock + quantity
                    : movementType === 'adjustment_count'
                    ? quantity
                    : Math.max(0, currentItem.currentStock - quantity)}{' '}
                  {currentItem.unit}
                </span>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
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
              <span>Apply Stock Movement</span>
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

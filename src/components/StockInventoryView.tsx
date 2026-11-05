/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Package,
  Wrench,
  Plus,
  Search,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Layers,
  CheckCircle,
  X,
} from 'lucide-react';
import { InventoryItem, ItemType, StockMovement, User } from '../types';
import { formatDate, formatDateTime, formatKES } from '../utils/formatters';

interface StockInventoryViewProps {
  inventory: InventoryItem[];
  stockMovements: StockMovement[];
  currentUser: User;
  onOpenStockMovement: (item?: InventoryItem) => void;
  onSaveNewItem: (item: InventoryItem) => void;
}

export const StockInventoryView: React.FC<StockInventoryViewProps> = ({
  inventory,
  stockMovements,
  currentUser,
  onOpenStockMovement,
  onSaveNewItem,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'services' | 'movements'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddItemModal, setShowAddItemModal] = useState(false);

  // New Item State
  const [newItemType, setNewItemType] = useState<ItemType>('product');
  const [newItemName, setNewItemName] = useState('');
  const [newItemSku, setNewItemSku] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('General');
  const [newItemUnit, setNewItemUnit] = useState('Pcs');
  const [newItemCostPrice, setNewItemCostPrice] = useState<number>(0);
  const [newItemSellingPrice, setNewItemSellingPrice] = useState<number>(0);
  const [newItemStock, setNewItemStock] = useState<number>(10);
  const [newItemReorder, setNewItemReorder] = useState<number>(5);

  const products = inventory.filter((i) => i.type === 'product');
  const services = inventory.filter((i) => i.type === 'service');

  const filteredItems = (activeTab === 'products' ? products : services).filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const lowStockCount = products.filter((p) => p.currentStock <= p.reorderLevel).length;
  const totalStockValuation = products.reduce((sum, p) => sum + p.currentStock * p.costPrice, 0);

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const sku = newItemSku.trim() || `${newItemType === 'product' ? 'PRD' : 'SRV'}-${Date.now().toString().slice(-4)}`;

    const newItem: InventoryItem = {
      id: `itm-${Date.now()}`,
      name: newItemName.trim(),
      sku,
      type: newItemType,
      category: newItemCategory.trim() || 'General',
      unit: newItemUnit.trim() || (newItemType === 'service' ? 'Service' : 'Pcs'),
      costPrice: newItemCostPrice,
      sellingPrice: newItemSellingPrice,
      currentStock: newItemType === 'product' ? newItemStock : 999,
      reorderLevel: newItemType === 'product' ? newItemReorder : 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    onSaveNewItem(newItem);
    setShowAddItemModal(false);
    setNewItemName('');
    setNewItemSku('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            Inventory & Warehouse Management
          </span>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Stock Catalog, Services & Movement Audit
          </h2>
          <p className="text-xs text-slate-500">
            Real-time stock quantities, reorder thresholds, gross margins, and movement logs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenStockMovement()}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restock / Movement</span>
          </button>

          <button
            onClick={() => setShowAddItemModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-transform active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Item</span>
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Stock Valuation (Cost)</span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">{formatKES(totalStockValuation)}</div>
          <span className="text-[10px] text-slate-500">{products.length} active physical products</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Low Stock Reorder Alerts</span>
          <div className="text-xl font-bold font-mono text-amber-700 mt-1">{lowStockCount} Items</div>
          <span className="text-[10px] text-slate-500">Current stock below safety threshold</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Billable Services & Labor</span>
          <div className="text-xl font-bold font-mono text-purple-800 mt-1">{services.length} Services</div>
          <span className="text-[10px] text-slate-500">Consultations, delivery, installations</span>
        </div>
      </div>

      {/* Segmented Tab Navigation & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'products' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Physical Products ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'services' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Services & Labor ({services.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('movements')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'movements' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Movement Audit Log ({stockMovements.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search SKU, item name, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-300 focus:bg-white"
          />
        </div>
      </div>

      {/* Tab 1 & 2: Items Table */}
      {(activeTab === 'products' || activeTab === 'services') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Item Name & SKU</th>
                  <th className="py-3 px-4">Category</th>
                  {activeTab === 'products' && <th className="py-3 px-4 text-center">Stock Level</th>}
                  <th className="py-3 px-4 text-right">Cost (KES)</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-right">Gross Margin</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-sans italic">
                      No items match your search.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const margin = item.sellingPrice > 0 ? ((item.sellingPrice - item.costPrice) / item.sellingPrice) * 100 : 0;
                    const isLow = item.type === 'product' && item.currentStock <= item.reorderLevel;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-sans">
                          <div className="font-semibold text-slate-900">{item.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            SKU: {item.sku} · Unit: {item.unit}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-sans whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                            {item.category}
                          </span>
                        </td>

                        {activeTab === 'products' && (
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-md ${
                              isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-800'
                            }`}>
                              {isLow && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                              <span>{item.currentStock} {item.unit}</span>
                            </span>
                          </td>
                        )}

                        <td className="py-3 px-4 text-right tabular-nums text-slate-600">
                          {formatKES(item.costPrice)}
                        </td>

                        <td className="py-3 px-4 text-right tabular-nums font-bold text-slate-900 text-sm">
                          {formatKES(item.sellingPrice)}
                        </td>

                        <td className="py-3 px-4 text-right tabular-nums font-semibold text-emerald-700">
                          {margin.toFixed(1)}%
                        </td>

                        <td className="py-3 px-4 text-center font-sans">
                          {item.type === 'product' ? (
                            <button
                              onClick={() => onOpenStockMovement(item)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
                            >
                              Restock
                            </button>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Stock Movement Log */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Movement Type</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Previous Stock</th>
                  <th className="py-3 px-4 text-right">New Stock</th>
                  <th className="py-3 px-4">Doc Ref / Note</th>
                  <th className="py-3 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {stockMovements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-sans whitespace-nowrap">
                      {formatDateTime(mov.date)}
                    </td>
                    <td className="py-3 px-4 font-sans font-medium text-slate-900">
                      {mov.itemName}
                    </td>
                    <td className="py-3 px-4 font-sans whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        mov.type === 'inward_purchase'
                          ? 'bg-emerald-100 text-emerald-800'
                          : mov.type === 'outward_sale'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {mov.type === 'inward_purchase' && <ArrowDownRight className="w-3 h-3" />}
                        {mov.type === 'outward_sale' && <ArrowUpRight className="w-3 h-3" />}
                        <span>{mov.type.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-bold text-slate-900">
                      {mov.quantity}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-500">
                      {mov.previousStock}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-bold text-emerald-800">
                      {mov.newStock}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-600 max-w-xs truncate">
                      {mov.reference ? `[${mov.reference}] ` : ''}{mov.notes || '—'}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-500">
                      {mov.createdBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                Register Product or Service
              </h3>
              <button
                onClick={() => setShowAddItemModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item Classification</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewItemType('product')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-colors ${
                      newItemType === 'product'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    Physical Product (Stocked)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewItemType('service')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-colors ${
                      newItemType === 'service'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    Service / Labor (Non-stocked)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Portland Cement 50kg, Farm Agronomy Visit"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Building Materials, Seeds"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Measurement Unit</label>
                  <input
                    type="text"
                    placeholder="e.g. Bags, Pcs, Litres, Hours"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Price (KES) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newItemCostPrice || ''}
                    onChange={(e) => setNewItemCostPrice(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price (KES) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newItemSellingPrice || ''}
                    onChange={(e) => setNewItemSellingPrice(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>

              {newItemType === 'product' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Opening Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={newItemStock}
                      onChange={(e) => setNewItemStock(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Alert Level</label>
                    <input
                      type="number"
                      min="0"
                      value={newItemReorder}
                      onChange={(e) => setNewItemReorder(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

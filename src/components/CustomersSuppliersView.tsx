/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Users, Truck, Plus, Search, Phone, Mail, MapPin, DollarSign, MessageSquare, X } from 'lucide-react';
import { BusinessProfile, Customer, Supplier, User } from '../types';
import { formatKES, generateWhatsAppLink } from '../utils/formatters';

interface CustomersSuppliersViewProps {
  customers: Customer[];
  suppliers: Supplier[];
  business: BusinessProfile;
  currentUser: User;
  onSaveCustomer: (customer: Customer) => void;
  onSaveSupplier: (supplier: Supplier) => void;
}

export const CustomersSuppliersView: React.FC<CustomersSuppliersViewProps> = ({
  customers,
  suppliers,
  business,
  currentUser,
  onSaveCustomer,
  onSaveSupplier,
}) => {
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [showAddCust, setShowAddCust] = useState(false);
  const [showAddSup, setShowAddSup] = useState(false);

  // New Customer State
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('+254 ');
  const [custEmail, setCustEmail] = useState('');
  const [custKraPin, setCustKraPin] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custCreditLimit, setCustCreditLimit] = useState<number>(100000);

  // New Supplier State
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('+254 ');
  const [supEmail, setSupEmail] = useState('');
  const [supKraPin, setSupKraPin] = useState('');
  const [supPaymentTerms, setSupPaymentTerms] = useState('30 Days Net');
  const [supBankDetails, setSupBankDetails] = useState('');

  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q) || (c.kraPin && c.kraPin.toLowerCase().includes(q));
  });

  const filteredSuppliers = suppliers.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.phone.toLowerCase().includes(q) || (s.kraPin && s.kraPin.toLowerCase().includes(q));
  });

  const totalReceivables = customers.reduce((sum, c) => sum + Math.max(0, c.currentBalance), 0);
  const totalPayables = suppliers.reduce((sum, s) => sum + Math.max(0, s.currentBalance), 0);

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) return;

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: custName.trim(),
      phone: custPhone.trim(),
      email: custEmail.trim(),
      kraPin: custKraPin.trim().toUpperCase() || undefined,
      address: custAddress.trim() || undefined,
      creditLimit: custCreditLimit,
      currentBalance: 0,
      createdAt: new Date().toISOString(),
    };

    onSaveCustomer(newCust);
    setShowAddCust(false);
    setCustName('');
    setCustEmail('');
    setCustKraPin('');
  };

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;

    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      name: supName.trim(),
      contactPerson: supContact.trim() || undefined,
      phone: supPhone.trim(),
      email: supEmail.trim(),
      kraPin: supKraPin.trim().toUpperCase() || undefined,
      paymentTerms: supPaymentTerms,
      bankOrMpesaDetails: supBankDetails.trim() || undefined,
      currentBalance: 0,
      createdAt: new Date().toISOString(),
    };

    onSaveSupplier(newSup);
    setShowAddSup(false);
    setSupName('');
    setSupEmail('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            Stakeholder Directory & CRM
          </span>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Customers & Vendor Suppliers
          </h2>
          <p className="text-xs text-slate-500">
            Maintain customer credit limits, outstanding balances, KRA PINs, and supplier payment terms
          </p>
        </div>

        <button
          onClick={() => (activeTab === 'customers' ? setShowAddCust(true) : setShowAddSup(true))}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{activeTab === 'customers' ? '+ Add Customer' : '+ Add Supplier'}</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex justify-between items-center">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Total Customer Receivables</span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">{formatKES(totalReceivables)}</div>
            <span className="text-[10px] text-slate-500">{customers.length} registered customers</span>
          </div>
          <Users className="w-8 h-8 text-emerald-200" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex justify-between items-center">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Total Supplier Payables</span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">{formatKES(totalPayables)}</div>
            <span className="text-[10px] text-slate-500">{suppliers.length} active trade vendors</span>
          </div>
          <Truck className="w-8 h-8 text-rose-200" />
        </div>
      </div>

      {/* Segmented Tab & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'customers' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Customers ({customers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'suppliers' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Suppliers ({suppliers.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search name, phone, KRA PIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-300 focus:bg-white"
          />
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeTab === 'customers' ? (
          filteredCustomers.length === 0 ? (
            <div className="col-span-full py-12 px-6 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-700">No customers registered yet</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Add your business clients now or let them be created on the fly when you issue invoices.
              </p>
              <button
                type="button"
                onClick={() => setShowAddCust(true)}
                className="mt-3.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs"
              >
                + Register First Customer
              </button>
            </div>
          ) : (
            filteredCustomers.map((c) => (
              <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                    {c.currentBalance > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 uppercase shrink-0">
                        Owes Debt
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5 text-xs text-slate-600 space-y-1">
                    <p className="flex items-center gap-1.5 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{c.phone}</span>
                    </p>
                    {c.email && (
                      <p className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{c.email}</span>
                      </p>
                    )}
                    {c.address && (
                      <p className="flex items-center gap-1.5 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{c.address}</span>
                      </p>
                    )}
                    {c.kraPin && (
                      <p className="text-[11px] text-slate-500">
                        KRA PIN: <span className="font-mono font-semibold text-slate-800">{c.kraPin}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Outstanding Balance</span>
                    <span className={`font-mono font-bold text-sm tabular-nums ${c.currentBalance > 0 ? 'text-amber-700' : 'text-slate-600'}`}>
                      {formatKES(c.currentBalance)}
                    </span>
                  </div>

                  {c.currentBalance > 0 && (
                    <a
                      href={generateWhatsAppLink({
                        phone: c.phone,
                        businessName: business.name,
                        customerName: c.name,
                        invoiceNumber: 'STATEMENT',
                        total: c.currentBalance,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl transition-colors"
                      title="Send WhatsApp payment reminder"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))
          )
        ) : (
          filteredSuppliers.length === 0 ? (
            <div className="col-span-full py-12 px-6 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <Truck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-700">No suppliers registered yet</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Register your vendors, wholesalers, utility providers, or landlords for expense tracking and payables.
              </p>
              <button
                type="button"
                onClick={() => setShowAddSup(true)}
                className="mt-3.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs"
              >
                + Register First Supplier
              </button>
            </div>
          ) : (
            filteredSuppliers.map((s) => (
              <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
                    {s.currentBalance > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 uppercase shrink-0">
                        Bill Due
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5 text-xs text-slate-600 space-y-1">
                    {s.contactPerson && (
                      <p className="text-slate-500 text-[11px]">Contact: <strong className="text-slate-800">{s.contactPerson}</strong></p>
                    )}
                    <p className="flex items-center gap-1.5 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{s.phone}</span>
                    </p>
                    {s.email && (
                      <p className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{s.email}</span>
                      </p>
                    )}
                    {s.paymentTerms && (
                      <p className="text-[11px] text-slate-500">
                        Terms: <span className="font-medium text-slate-700">{s.paymentTerms}</span>
                      </p>
                    )}
                    {s.bankOrMpesaDetails && (
                      <p className="text-[11px] text-slate-500 truncate">
                        Pay Details: <span className="font-mono">{s.bankOrMpesaDetails}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Payables Balance</span>
                    <span className={`font-mono font-bold text-sm tabular-nums ${s.currentBalance > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                      {formatKES(s.currentBalance)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddCust && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Register New Customer
              </h3>
              <button onClick={() => setShowAddCust(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mara Timber & Hardware Ltd"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (M-Pesa) *</label>
                  <input
                    type="tel"
                    required
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">KRA PIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="P051..."
                    value={custKraPin}
                    onChange={(e) => setCustKraPin(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 uppercase font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. procurement@maratimber.ke"
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Address / City</label>
                <input
                  type="text"
                  placeholder="e.g. Nakuru Town, West End Arcade"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Approved Credit Limit (KES)</label>
                <input
                  type="number"
                  min="0"
                  value={custCreditLimit}
                  onChange={(e) => setCustCreditLimit(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCust(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAddSup && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                Register New Supplier
              </h3>
              <button onClick={() => setShowAddSup(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kenya Steel Mills Ltd"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Peter Kariuki"
                    value={supContact}
                    onChange={(e) => setSupContact(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">KRA PIN</label>
                  <input
                    type="text"
                    placeholder="P051..."
                    value={supKraPin}
                    onChange={(e) => setSupKraPin(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Credit Terms</label>
                  <input
                    type="text"
                    placeholder="e.g. 14 Days, 30 Days Net"
                    value={supPaymentTerms}
                    onChange={(e) => setSupPaymentTerms(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Details (Bank / Paybill)</label>
                <input
                  type="text"
                  placeholder="e.g. KCB A/C 11029384 or Till 554433"
                  value={supBankDetails}
                  onChange={(e) => setSupBankDetails(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSup(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

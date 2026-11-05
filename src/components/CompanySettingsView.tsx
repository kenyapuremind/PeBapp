/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Building2,
  FileSpreadsheet,
  Shield,
  CreditCard,
  Plus,
  CheckCircle,
  Smartphone,
  Landmark,
  FileText,
  Percent,
  Download,
  ExternalLink,
  RefreshCw,
  X,
  AlertCircle,
} from 'lucide-react';
import { CompanyProfile, GoogleSheetSyncConfig, SubscriptionBill, User } from '../types';
import { formatDateTime, formatKES } from '../utils/formatters';
import { exportToCSV } from '../utils/pdfGenerator';

interface CompanySettingsViewProps {
  companies: CompanyProfile[];
  activeCompany: CompanyProfile;
  subscriptionBills: SubscriptionBill[];
  currentUser: User;
  onUpdateCompany: (company: CompanyProfile) => void;
  onSelectCompany: (companyId: string) => void;
  onCreateCompany: (newCompany: CompanyProfile) => void;
  onIssueSubscriptionBill: (bill: SubscriptionBill) => void;
  onSaveGoogleSheetConfig: (config: GoogleSheetSyncConfig) => void;
  salesData: any[];
  expensesData: any[];
}

export const CompanySettingsView: React.FC<CompanySettingsViewProps> = ({
  companies,
  activeCompany,
  subscriptionBills,
  currentUser,
  onUpdateCompany,
  onSelectCompany,
  onCreateCompany,
  onIssueSubscriptionBill,
  onSaveGoogleSheetConfig,
  salesData,
  expensesData,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'companies' | 'gsheet' | 'admin'>('details');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form State for Active Company Details
  const [name, setName] = useState(activeCompany.name);
  const [tradingName, setTradingName] = useState(activeCompany.tradingName);
  const [kraPin, setKraPin] = useState(activeCompany.kraPin);
  const [phone, setPhone] = useState(activeCompany.phone);
  const [email, setEmail] = useState(activeCompany.email);
  const [address, setAddress] = useState(activeCompany.address);
  const [city, setCity] = useState(activeCompany.city);
  const [defaultTaxRate, setDefaultTaxRate] = useState(activeCompany.defaultTaxRate);
  const [defaultTaxMode, setDefaultTaxMode] = useState(activeCompany.defaultTaxMode);
  const [mpesaTillNumber, setMpesaTillNumber] = useState(activeCompany.mpesaTillNumber || '');
  const [mpesaPaybillNumber, setMpesaPaybillNumber] = useState(activeCompany.mpesaPaybillNumber || '');
  const [mpesaAccountNumber, setMpesaAccountNumber] = useState(activeCompany.mpesaAccountNumber || '');
  const [bankName, setBankName] = useState(activeCompany.bankName || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(activeCompany.bankAccountNumber || '');
  const [bankBranch, setBankBranch] = useState(activeCompany.bankBranch || '');
  const [invoicePrefix, setInvoicePrefix] = useState(activeCompany.invoicePrefix);
  const [receiptPrefix, setReceiptPrefix] = useState(activeCompany.receiptPrefix);
  const [invoiceFooterNote, setInvoiceFooterNote] = useState(activeCompany.invoiceFooterNote);

  // Add Company Modal State
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [newCompTrading, setNewCompTrading] = useState('');
  const [newCompPin, setNewCompPin] = useState('');
  const [newCompCity, setNewCompCity] = useState('Nairobi');

  // Google Sheets state
  const [gsheetUrl, setGsheetUrl] = useState('https://script.google.com/macros/s/AKfycbxBiasharaFlowSync/exec');
  const [gsheetSyncing, setGsheetSyncing] = useState(false);
  const [gsheetSuccess, setGsheetSuccess] = useState(false);

  // Issue Bill Modal
  const [showIssueBillModal, setShowIssueBillModal] = useState(false);
  const [billCompanyId, setBillCompanyId] = useState(companies[0]?.id || '');
  const [billPlanName, setBillPlanName] = useState<'Starter SME' | 'Growth Enterprise' | 'Corporate Multi-Branch'>('Growth Enterprise');
  const [billAmount, setBillAmount] = useState<number>(4500);

  // Sync state if active company changes
  React.useEffect(() => {
    setName(activeCompany.name);
    setTradingName(activeCompany.tradingName);
    setKraPin(activeCompany.kraPin);
    setPhone(activeCompany.phone);
    setEmail(activeCompany.email);
    setAddress(activeCompany.address);
    setCity(activeCompany.city);
    setDefaultTaxRate(activeCompany.defaultTaxRate);
    setDefaultTaxMode(activeCompany.defaultTaxMode);
    setMpesaTillNumber(activeCompany.mpesaTillNumber || '');
    setMpesaPaybillNumber(activeCompany.mpesaPaybillNumber || '');
    setMpesaAccountNumber(activeCompany.mpesaAccountNumber || '');
    setBankName(activeCompany.bankName || '');
    setBankAccountNumber(activeCompany.bankAccountNumber || '');
    setBankBranch(activeCompany.bankBranch || '');
    setInvoicePrefix(activeCompany.invoicePrefix);
    setReceiptPrefix(activeCompany.receiptPrefix);
    setInvoiceFooterNote(activeCompany.invoiceFooterNote);
  }, [activeCompany]);

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: CompanyProfile = {
      ...activeCompany,
      name: name.trim(),
      tradingName: tradingName.trim(),
      kraPin: kraPin.trim().toUpperCase(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      city: city.trim(),
      defaultTaxRate: Number(defaultTaxRate),
      defaultTaxMode,
      mpesaTillNumber: mpesaTillNumber.trim() || undefined,
      mpesaPaybillNumber: mpesaPaybillNumber.trim() || undefined,
      mpesaAccountNumber: mpesaAccountNumber.trim() || undefined,
      bankName: bankName.trim() || undefined,
      bankAccountNumber: bankAccountNumber.trim() || undefined,
      bankBranch: bankBranch.trim() || undefined,
      invoicePrefix: invoicePrefix.trim(),
      receiptPrefix: receiptPrefix.trim(),
      invoiceFooterNote: invoiceFooterNote.trim(),
    };

    onUpdateCompany(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName.trim()) return;

    const newComp: CompanyProfile = {
      id: `comp-${Date.now()}`,
      name: newCompName.trim(),
      tradingName: newCompTrading.trim() || newCompName.trim(),
      kraPin: newCompPin.trim().toUpperCase() || 'P051000000X',
      phone: '+254 700 000 000',
      email: 'info@business.ke',
      address: 'Main Street',
      city: newCompCity,
      country: 'Kenya',
      currency: 'KES',
      defaultTaxRate: 16,
      defaultTaxMode: 'exclusive',
      invoicePrefix: `${newCompName.substring(0, 3).toUpperCase()}-2026-`,
      receiptPrefix: `${newCompName.substring(0, 3).toUpperCase()}R-2026-`,
      invoiceFooterNote: 'Thank you for your business. Payment due in 14 days.',
      subscriptionPlan: 'growth',
      subscriptionStatus: 'active',
      subscriptionExpiry: '2027-01-01T00:00:00Z',
      monthlyFee: 4500,
      createdAt: new Date().toISOString(),
    };

    onCreateCompany(newComp);
    setShowAddCompanyModal(false);
    setNewCompName('');
    setNewCompTrading('');
  };

  const handleSyncToGoogleSheets = async () => {
    setGsheetSyncing(true);
    setGsheetSuccess(false);

    // Simulate pushing spreadsheet rows to Google Apps Script Webhook
    setTimeout(() => {
      setGsheetSyncing(false);
      setGsheetSuccess(true);
      onSaveGoogleSheetConfig({
        webhookUrl: gsheetUrl,
        autoSync: true,
        lastSyncTime: new Date().toISOString(),
      });
      setTimeout(() => setGsheetSuccess(false), 4000);
    }, 1200);
  };

  const handleDownloadGoogleSheetsCSV = () => {
    const combinedData = [
      ...salesData.map((s) => ({
        Type: 'SALE',
        DocNumber: s.invoiceNumber,
        Entity: s.entityName,
        Date: s.date,
        Amount: s.grandTotal,
        VAT: s.taxAmount,
        PaymentMethod: s.paymentMethod,
        Status: s.paymentStatus,
      })),
      ...expensesData.map((e) => ({
        Type: 'EXPENSE',
        DocNumber: e.billNumber || 'EXP',
        Entity: e.supplierName,
        Date: e.date,
        Amount: e.totalWithTax,
        VAT: e.taxAmount,
        PaymentMethod: e.paymentMethod,
        Status: e.paymentStatus,
      })),
    ];
    exportToCSV(combinedData, `GoogleSheets-Sync-${activeCompany.name.replace(/\s+/g, '_')}.csv`);
  };

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    const targetComp = companies.find((c) => c.id === billCompanyId) || activeCompany;
    const now = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const bill: SubscriptionBill = {
      id: `sub-bill-${Date.now().toString().slice(-4)}`,
      companyId: targetComp.id,
      companyName: targetComp.name,
      planName: billPlanName,
      amount: billAmount,
      billingCycle: 'Monthly',
      issueDate: now.toISOString().slice(0, 10),
      dueDate: dueDate.toISOString().slice(0, 10),
      paymentStatus: 'pending',
      notes: `Monthly recurring SaaS platform license for ${targetComp.name}`,
    };

    onIssueSubscriptionBill(bill);
    setShowIssueBillModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            Organization Administration
          </span>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Company Profile, Multi-Company & SaaS Admin
          </h2>
          <p className="text-xs text-slate-500">
            Active Company: <strong className="text-slate-900">{activeCompany.name}</strong> ({activeCompany.city}, Kenya)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <CheckCircle className="w-3.5 h-3.5" /> Details Saved!
            </span>
          )}
        </div>
      </div>

      {/* Segmented Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-1 text-xs">
        <button
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2 font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'details'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Edit Company Details</span>
        </button>

        <button
          onClick={() => setActiveTab('companies')}
          className={`px-4 py-2 font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'companies'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Manage Companies ({companies.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('gsheet')}
          className={`px-4 py-2 font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'gsheet'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Google Sheets Sync</span>
        </button>

        <button
          onClick={() => setActiveTab('admin')}
          className={`px-4 py-2 font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'admin'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>SaaS Subscriptions & Admin</span>
        </button>
      </div>

      {/* TAB 1: EDIT COMPANY DETAILS */}
      {activeTab === 'details' && (
        <form onSubmit={handleSaveDetails} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          
          {/* General Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-2">
              Legal Business Particulars
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Registered Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Trading Name / Brand Lockup</label>
                <input
                  type="text"
                  value={tradingName}
                  onChange={(e) => setTradingName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kenya Revenue Authority (KRA PIN) *</label>
                <input
                  type="text"
                  required
                  value={kraPin}
                  onChange={(e) => setKraPin(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Business Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Finance & Invoicing Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Town / City (Kenya)</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-300"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Address / Street / Building</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-300"
                />
              </div>
            </div>
          </div>

          {/* Tax & Invoicing Defaults */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-2">
              Taxation & Invoicing Configuration
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Default KRA VAT Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={defaultTaxRate}
                  onChange={(e) => setDefaultTaxRate(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Default Tax Mode</label>
                <select
                  value={defaultTaxMode}
                  onChange={(e) => setDefaultTaxMode(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 font-medium"
                >
                  <option value="exclusive">Exclusive (Tax added on subtotal)</option>
                  <option value="inclusive">Inclusive (Prices already have tax)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Prefix</label>
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice & Receipt Footer Note</label>
              <input
                type="text"
                value={invoiceFooterNote}
                onChange={(e) => setInvoiceFooterNote(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-300"
              />
            </div>
          </div>

          {/* Payment Channels (M-Pesa & Bank) */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-2">
              Payment Channels (M-Pesa & Bank Wire)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">M-Pesa Buy Goods Till Number</label>
                <input
                  type="text"
                  placeholder="e.g. 892341"
                  value={mpesaTillNumber}
                  onChange={(e) => setMpesaTillNumber(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 font-mono font-bold text-emerald-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">M-Pesa Paybill Number</label>
                <input
                  type="text"
                  placeholder="e.g. 247247"
                  value={mpesaPaybillNumber}
                  onChange={(e) => setMpesaPaybillNumber(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Paybill Account Number</label>
                <input
                  type="text"
                  placeholder="e.g. 89234100 or INVOICE NO"
                  value={mpesaAccountNumber}
                  onChange={(e) => setMpesaAccountNumber(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. Equity Bank Kenya"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Account Number</label>
                <input
                  type="text"
                  placeholder="e.g. 018029384756"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Branch</label>
                <input
                  type="text"
                  placeholder="e.g. Upper Hill Nairobi"
                  value={bankBranch}
                  onChange={(e) => setBankBranch(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-300"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-transform active:scale-[0.98]"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Save Company Profile</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: MANAGE MULTIPLE COMPANIES */}
      {activeTab === 'companies' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Registered Business Entities & Subsidiaries</h3>
              <p className="text-xs text-slate-500">Switch active company to toggle ledgers, invoicing, and branches</p>
            </div>
            <button
              onClick={() => setShowAddCompanyModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Subsidiary / Company</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((comp) => {
              const isActive = comp.id === activeCompany.id;

              return (
                <div
                  key={comp.id}
                  className={`bg-white p-5 rounded-2xl border shadow-xs space-y-4 flex flex-col justify-between ${
                    isActive ? 'border-emerald-600 ring-2 ring-emerald-600/20' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {comp.city} Branch
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-600 text-white">
                          Current Active
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-slate-900 mt-2">{comp.name}</h4>
                    <p className="text-xs text-slate-500">{comp.tradingName}</p>

                    <div className="mt-3 text-xs text-slate-600 space-y-1 font-mono">
                      <p>KRA PIN: <strong className="text-slate-900">{comp.kraPin}</strong></p>
                      <p>Phone: {comp.phone}</p>
                      <p>Till: {comp.mpesaTillNumber || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">
                      Plan: <strong className="capitalize text-slate-800">{comp.subscriptionPlan}</strong>
                    </span>

                    {isActive ? (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Active
                      </span>
                    ) : (
                      <button
                        onClick={() => onSelectCompany(comp.id)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
                      >
                        Switch to Company
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: GOOGLE SHEETS SYNC INTEGRATION */}
      {activeTab === 'gsheet' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Google Sheets Real-Time Sync Connector</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Link BiasharaFlow to automatically store and backup daily sales, expenses, and payroll into your Google Sheet
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadGoogleSheetsCSV}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Google Sheet CSV</span>
              </button>

              <button
                onClick={handleSyncToGoogleSheets}
                disabled={gsheetSyncing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${gsheetSyncing ? 'animate-spin' : ''}`} />
                <span>{gsheetSyncing ? 'Pushing Data...' : 'Sync to Google Sheet Now'}</span>
              </button>
            </div>
          </div>

          {gsheetSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Google Sheet synchronization successful! Sales and expense records appended to cloud spreadsheet.</span>
            </div>
          )}

          {/* Webhook URL Input */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-800">
              Google Apps Script Web App Webhook URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={gsheetUrl}
                onChange={(e) => setGsheetUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-300 font-mono text-slate-800"
              />
              <button
                onClick={handleSyncToGoogleSheets}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold shrink-0"
              >
                Test Endpoint
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Data transmitted: Invoices, Sales totals, Tax amounts, Expense vouchers, and Payroll disbursements.
            </p>
          </div>

          {/* Quick Setup Instructions */}
          <div className="space-y-2 text-xs text-slate-600">
            <h4 className="font-bold text-slate-900">How to connect your personal Google Sheet:</h4>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Open a new or existing spreadsheet in <strong>Google Sheets</strong>.</li>
              <li>Click <strong>Extensions &gt; Apps Script</strong>.</li>
              <li>Paste the standard BiasharaFlow webhook receiver script (saves rows directly to active sheet).</li>
              <li>Click <strong>Deploy &gt; New deployment</strong>, select <strong>Web App</strong>, set access to <strong>Anyone</strong>, and copy your URL here!</li>
            </ol>
          </div>
        </div>
      )}

      {/* TAB 4: SAAS SUBSCRIPTION ADMIN */}
      {activeTab === 'admin' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Platform SaaS Administration
              </span>
              <h3 className="text-lg font-bold mt-0.5">Subscription Licenses & Invoicing Engine</h3>
              <p className="text-xs text-slate-300">
                Track active client subscriptions, renewal dates, and dispatch automated monthly billing
              </p>
            </div>

            <button
              onClick={() => setShowIssueBillModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <CreditCard className="w-4 h-4" />
              <span>+ Issue Subscription Bill</span>
            </button>
          </div>

          {/* Subscription Bills Ledger */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Issued Tenant Subscription Bills ({subscriptionBills.length})
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Bill # / Issue Date</th>
                    <th className="py-3 px-4">Tenant Company</th>
                    <th className="py-3 px-4">Plan Tier</th>
                    <th className="py-3 px-4">Cycle</th>
                    <th className="py-3 px-4 text-right">Fee (KES)</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {subscriptionBills.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{b.id}</div>
                        <div className="text-[10px] text-slate-400 font-sans">{b.issueDate}</div>
                      </td>

                      <td className="py-3 px-4 font-sans font-medium text-slate-900">
                        {b.companyName}
                      </td>

                      <td className="py-3 px-4 font-sans">
                        <span className="font-semibold text-emerald-800">{b.planName}</span>
                      </td>

                      <td className="py-3 px-4 font-sans text-slate-600">
                        {b.billingCycle}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatKES(b.amount)}
                      </td>

                      <td className="py-3 px-4 font-sans text-slate-600">
                        {b.dueDate}
                      </td>

                      <td className="py-3 px-4 text-center font-sans">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          b.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {b.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Company Modal */}
      {showAddCompanyModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Create New Company / Branch</h3>
              <button onClick={() => setShowAddCompanyModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Savannah Agro Logistics Ltd"
                  value={newCompName}
                  onChange={(e) => setNewCompName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Trading Name</label>
                <input
                  type="text"
                  placeholder="e.g. Savannah Mombasa Hub"
                  value={newCompTrading}
                  onChange={(e) => setNewCompTrading(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">KRA PIN</label>
                  <input
                    type="text"
                    placeholder="P051..."
                    value={newCompPin}
                    onChange={(e) => setNewCompPin(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Branch City</label>
                  <input
                    type="text"
                    value={newCompCity}
                    onChange={(e) => setNewCompCity(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCompanyModal(false)}
                  className="px-4 py-2 text-xs border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                >
                  Create Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Subscription Bill Modal */}
      {showIssueBillModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Issue SaaS Subscription Bill</h3>
              <button onClick={() => setShowIssueBillModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBill} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Tenant Company</label>
                <select
                  value={billCompanyId}
                  onChange={(e) => setBillCompanyId(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 font-medium"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Tier</label>
                <select
                  value={billPlanName}
                  onChange={(e) => setBillPlanName(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 font-medium"
                >
                  <option value="Starter SME">Starter SME (KES 2,500/mo)</option>
                  <option value="Growth Enterprise">Growth Enterprise (KES 4,500/mo)</option>
                  <option value="Corporate Multi-Branch">Corporate Multi-Branch (KES 9,500/mo)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Billing Amount (KES)</label>
                <input
                  type="number"
                  min="0"
                  value={billAmount}
                  onChange={(e) => setBillAmount(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 font-mono font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowIssueBillModal(false)}
                  className="px-4 py-2 text-xs border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                >
                  Dispatch Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

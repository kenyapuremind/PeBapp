/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Smartphone,
  Monitor,
  Shield,
  Plus,
  Users,
  ChevronDown,
  Bell,
  LogOut,
  Building2,
  FileCheck,
  DollarSign,
  Settings,
} from 'lucide-react';
import { CompanyProfile, User } from '../types';
import { ROLE_PERMISSIONS } from '../utils/auth';

interface TopNavProps {
  companies: CompanyProfile[];
  activeCompany: CompanyProfile;
  currentUser: User;
  activeTab: string;
  isMobileDeviceView: boolean;
  unreadNotificationsCount: number;
  onSelectTab: (tab: string) => void;
  onSelectCompany: (companyId: string) => void;
  onToggleDeviceView: () => void;
  onOpenTeamSecurity: () => void;
  onOpenQuickSale: () => void;
  onOpenNotifications: () => void;
  onLogout: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  companies,
  activeCompany,
  currentUser,
  activeTab,
  isMobileDeviceView,
  unreadNotificationsCount,
  onSelectTab,
  onSelectCompany,
  onToggleDeviceView,
  onOpenTeamSecurity,
  onOpenQuickSale,
  onOpenNotifications,
  onLogout,
}) => {
  const perms = ROLE_PERMISSIONS[currentUser.role];

  return (
    <header className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Zone 1: Brand Wordmark & Company Branch Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2 text-left group"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:bg-emerald-800 transition-colors">
              BF
            </div>
            <div className="hidden sm:block">
              <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-emerald-800 transition-colors whitespace-nowrap">
                BiasharaFlow
              </span>
            </div>
          </button>

          {/* Multi-Company Selector Pill */}
          <div className="flex items-center bg-slate-100 px-2 py-1 rounded-xl border border-slate-200 text-xs">
            <Building2 className="w-3.5 h-3.5 text-emerald-700 mr-1.5 shrink-0" />
            <select
              value={activeCompany.id}
              onChange={(e) => onSelectCompany(e.target.value)}
              className="bg-transparent border-none text-slate-800 font-bold text-[11px] sm:text-xs focus:ring-0 cursor-pointer pr-5 py-0 max-w-[130px] sm:max-w-[190px] truncate"
              title="Switch Active Company / Branch"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden xl:flex items-center gap-5 text-xs font-semibold text-slate-600">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`whitespace-nowrap transition-colors py-1 hover:text-slate-900 ${
              activeTab === 'dashboard' ? 'text-emerald-700 font-bold border-b-2 border-emerald-700' : ''
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => onSelectTab('sales')}
            className={`whitespace-nowrap transition-colors py-1 hover:text-slate-900 ${
              activeTab === 'sales' ? 'text-emerald-700 font-bold border-b-2 border-emerald-700' : ''
            }`}
          >
            Sales
          </button>

          {perms.canViewExpenses && (
            <button
              onClick={() => onSelectTab('expenses')}
              className={`whitespace-nowrap transition-colors py-1 hover:text-slate-900 ${
                activeTab === 'expenses' ? 'text-emerald-700 font-bold border-b-2 border-emerald-700' : ''
              }`}
            >
              Expenses
            </button>
          )}

          {perms.canManageInventory && (
            <button
              onClick={() => onSelectTab('inventory')}
              className={`whitespace-nowrap transition-colors py-1 hover:text-slate-900 ${
                activeTab === 'inventory' ? 'text-emerald-700 font-bold border-b-2 border-emerald-700' : ''
              }`}
            >
              Stock
            </button>
          )}

          <button
            onClick={() => onSelectTab('payroll')}
            className={`whitespace-nowrap transition-colors py-1 hover:text-slate-900 ${
              activeTab === 'payroll' ? 'text-emerald-700 font-bold border-b-2 border-emerald-700' : ''
            }`}
          >
            Payroll
          </button>

          <button
            onClick={() => onSelectTab('approvals')}
            className={`whitespace-nowrap transition-colors py-1 hover:text-slate-900 ${
              activeTab === 'approvals' ? 'text-emerald-700 font-bold border-b-2 border-emerald-700' : ''
            }`}
          >
            Approvals
          </button>

          {perms.canViewReports && (
            <button
              onClick={() => onSelectTab('reports')}
              className={`whitespace-nowrap transition-colors py-1 hover:text-slate-900 ${
                activeTab === 'reports' ? 'text-emerald-700 font-bold border-b-2 border-emerald-700' : ''
              }`}
            >
              Reports
            </button>
          )}

          <button
            onClick={() => onSelectTab('company_settings')}
            className={`whitespace-nowrap transition-colors py-1 hover:text-slate-900 ${
              activeTab === 'company_settings' ? 'text-emerald-700 font-bold border-b-2 border-emerald-700' : ''
            }`}
          >
            Company & Admin
          </button>
        </nav>

        {/* Zone 3: Actions, Notifications, User & Logout */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            title="View Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white font-bold text-[9px] flex items-center justify-center">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Device Viewport Toggle (Desktop ↔ Smartphone Preview) */}
          <button
            onClick={onToggleDeviceView}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title={isMobileDeviceView ? 'Switch to Full Desktop Canvas' : 'Preview Smartphone View'}
          >
            {isMobileDeviceView ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
            <span className="text-[11px]">{isMobileDeviceView ? 'Desktop' : 'Mobile'}</span>
          </button>

          {/* User & RBAC Switcher */}
          <button
            onClick={onOpenTeamSecurity}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors text-left"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
              {currentUser.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-bold text-slate-900 leading-none truncate max-w-[100px]">
                {currentUser.name.split(' ')[0]}
              </div>
              <div className="text-[10px] text-emerald-700 font-medium leading-tight mt-0.5 capitalize">
                {currentUser.role.replace('_', ' ')}
              </div>
            </div>
          </button>

          {/* Quick Sale CTA */}
          {perms.canRecordSales && (
            <button
              onClick={onOpenQuickSale}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 transition-transform active:scale-[0.97]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sale</span>
            </button>
          )}

          {/* Log Out Button */}
          <button
            onClick={onLogout}
            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors ml-1"
            title="Log Out User"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};

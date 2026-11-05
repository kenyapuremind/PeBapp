/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Plus,
  Package,
  Receipt,
  TrendingUp,
  MoreHorizontal,
  Building2,
  FileCheck,
  DollarSign,
  Users,
  LogOut,
  X,
  Shield,
  FileSpreadsheet,
} from 'lucide-react';
import { User } from '../types';
import { ROLE_PERMISSIONS } from '../utils/auth';

interface MobileBottomNavProps {
  activeTab: string;
  currentUser: User;
  unreadCount?: number;
  onSelectTab: (tab: string) => void;
  onOpenQuickSale: () => void;
  onOpenTeamSecurity: () => void;
  onLogout: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  currentUser,
  unreadCount = 0,
  onSelectTab,
  onOpenQuickSale,
  onOpenTeamSecurity,
  onLogout,
}) => {
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);
  const perms = ROLE_PERMISSIONS[currentUser.role];

  const handleNavigate = (tab: string) => {
    onSelectTab(tab);
    setShowMoreDrawer(false);
  };

  return (
    <>
      {/* Slide-Up Mobile More Drawer */}
      {showMoreDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end lg:hidden">
          <div className="bg-white rounded-t-3xl p-5 shadow-2xl border-t border-slate-200 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">All Modules & Settings</h3>
              <button
                onClick={() => setShowMoreDrawer(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <button
                onClick={() => handleNavigate('payroll')}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 ${
                  activeTab === 'payroll' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold' : 'border-slate-200 text-slate-800'
                }`}
              >
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="font-semibold">Payroll & HR</div>
                  <div className="text-[10px] text-slate-500">Kenyan PAYE / NSSF</div>
                </div>
              </button>

              <button
                onClick={() => handleNavigate('approvals')}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 ${
                  activeTab === 'approvals' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold' : 'border-slate-200 text-slate-800'
                }`}
              >
                <FileCheck className="w-4 h-4 text-purple-600" />
                <div>
                  <div className="font-semibold">Approvals</div>
                  <div className="text-[10px] text-slate-500">Requisitions</div>
                </div>
              </button>

              <button
                onClick={() => handleNavigate('reports')}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 ${
                  activeTab === 'reports' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold' : 'border-slate-200 text-slate-800'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="font-semibold">Reports Suite</div>
                  <div className="text-[10px] text-slate-500">P&L, Balance Sheet</div>
                </div>
              </button>

              <button
                onClick={() => handleNavigate('company_settings')}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 ${
                  activeTab === 'company_settings' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold' : 'border-slate-200 text-slate-800'
                }`}
              >
                <Building2 className="w-4 h-4 text-amber-600" />
                <div>
                  <div className="font-semibold">Company & Admin</div>
                  <div className="text-[10px] text-slate-500">Multi-branch, SaaS</div>
                </div>
              </button>

              <button
                onClick={() => handleNavigate('directory')}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 ${
                  activeTab === 'directory' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold' : 'border-slate-200 text-slate-800'
                }`}
              >
                <Users className="w-4 h-4 text-slate-700" />
                <div>
                  <div className="font-semibold">Directory</div>
                  <div className="text-[10px] text-slate-500">Customers, Vendors</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowMoreDrawer(false);
                  onOpenTeamSecurity();
                }}
                className="p-3 rounded-xl border border-slate-200 text-left flex items-center gap-2.5 text-slate-800"
              >
                <Shield className="w-4 h-4 text-emerald-700" />
                <div>
                  <div className="font-semibold">Security & 2FA</div>
                  <div className="text-[10px] text-slate-500">Biometrics, Passkeys</div>
                </div>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowMoreDrawer(false);
                  onLogout();
                }}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Tab Bar */}
      <div className="no-print fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 xl:hidden shadow-lg">
        <div className="max-w-md mx-auto grid grid-cols-5 items-center h-16 px-1">
          
          {/* Tab 1: Home */}
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-colors ${
              activeTab === 'dashboard' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-1">Home</span>
          </button>

          {/* Tab 2: Sales */}
          <button
            onClick={() => onSelectTab('sales')}
            className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-colors ${
              activeTab === 'sales' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-1">Sales</span>
          </button>

          {/* Center Tab: Floating Action Button (+ Sale) */}
          <div className="flex items-center justify-center -mt-5">
            <button
              onClick={onOpenQuickSale}
              className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/30 flex items-center justify-center active:scale-95 transition-transform"
              aria-label="New Sale"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {/* Tab 4: Stock / Expenses */}
          <button
            onClick={() => onSelectTab(perms.canManageInventory ? 'inventory' : 'expenses')}
            className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-colors ${
              (activeTab === 'inventory' || activeTab === 'expenses') ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {perms.canManageInventory ? <Package className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
            <span className="text-[10px] font-medium tracking-tight mt-1">
              {perms.canManageInventory ? 'Stock' : 'Expenses'}
            </span>
          </button>

          {/* Tab 5: More Drawer Toggle */}
          <button
            onClick={() => setShowMoreDrawer(true)}
            className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-colors relative ${
              showMoreDrawer ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight mt-1">More</span>
            {unreadCount > 0 && (
              <span className="absolute top-2 right-4 w-2 h-2 rounded-full bg-rose-600" />
            )}
          </button>

        </div>
      </div>
    </>
  );
};

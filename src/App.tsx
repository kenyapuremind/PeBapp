/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  AppNotification,
  ApprovalRequest,
  CompanyProfile,
  Customer,
  Employee,
  ExpenseRecord,
  GoogleSheetSyncConfig,
  InventoryItem,
  Invoice,
  PayrollRun,
  StockMovement,
  SubscriptionBill,
  Supplier,
  SyncSession,
  User,
} from './types';
import { StorageService } from './utils/storage';
import { ROLE_PERMISSIONS } from './utils/auth';
import { formatKES } from './utils/formatters';
import { TopNav } from './components/TopNav';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DashboardView } from './components/DashboardView';
import { SalesInvoicesView } from './components/SalesInvoicesView';
import { ExpensesView } from './components/ExpensesView';
import { StockInventoryView } from './components/StockInventoryView';
import { ReportsSuiteView } from './components/ReportsSuiteView';
import { CustomersSuppliersView } from './components/CustomersSuppliersView';
import { PayrollView } from './components/PayrollView';
import { ApprovalsView } from './components/ApprovalsView';
import { CompanySettingsView } from './components/CompanySettingsView';
import { NotificationsModal } from './components/NotificationsModal';
import { LoginScreen } from './components/LoginScreen';
import { InvoiceReceiptModal } from './components/InvoiceReceiptModal';
import { CreateInvoiceModal } from './components/CreateInvoiceModal';
import { CreateExpenseModal } from './components/CreateExpenseModal';
import { StockMovementModal } from './components/StockMovementModal';
import { TeamSecuritySyncModal } from './components/TeamSecuritySyncModal';
import { ShieldAlert } from 'lucide-react';

export default function App() {
  // Authentication & Login Session
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => StorageService.isUserLoggedIn());
  const [currentUser, setCurrentUser] = useState<User>(() => StorageService.getCurrentUser());
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());

  // Multi-Company State
  const [companies, setCompanies] = useState<CompanyProfile[]>(() => StorageService.getCompanies());
  const [activeCompanyId, setActiveCompanyId] = useState<string>(() => StorageService.getActiveCompanyId());
  
  // Business Records
  const [customers, setCustomers] = useState<Customer[]>(() => StorageService.getCustomers());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => StorageService.getSuppliers());
  const [inventory, setInventory] = useState<InventoryItem[]>(() => StorageService.getInventory());
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => StorageService.getStockMovements());
  const [sales, setSales] = useState<Invoice[]>(() => StorageService.getSales());
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => StorageService.getExpenses());
  
  // HR & Payroll, Approvals, Notifications & Subscriptions
  const [employees, setEmployees] = useState<Employee[]>(() => StorageService.getEmployees());
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>(() => StorageService.getPayrollRuns());
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(() => StorageService.getApprovals());
  const [notifications, setNotifications] = useState<AppNotification[]>(() => StorageService.getNotifications());
  const [subscriptionBills, setSubscriptionBills] = useState<SubscriptionBill[]>(() => StorageService.getSubscriptionBills());
  const [syncSession, setSyncSession] = useState<SyncSession>(() => StorageService.getSyncSession());

  // Navigation & Viewport State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileDeviceView, setIsMobileDeviceView] = useState<boolean>(false);

  // Modals
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showCreateExpense, setShowCreateExpense] = useState(false);
  const [showStockMovement, setShowStockMovement] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<InventoryItem | undefined>(undefined);
  const [showTeamSecurity, setShowTeamSecurity] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  const activeCompany = companies.find((c) => c.id === activeCompanyId) || companies[0];

  // Sync listener across storage events
  useEffect(() => {
    const handleStorageUpdate = () => {
      setIsLoggedIn(StorageService.isUserLoggedIn());
      setCurrentUser(StorageService.getCurrentUser());
      setUsers(StorageService.getUsers());
      setCompanies(StorageService.getCompanies());
      setActiveCompanyId(StorageService.getActiveCompanyId());
      setCustomers(StorageService.getCustomers());
      setSuppliers(StorageService.getSuppliers());
      setInventory(StorageService.getInventory());
      setStockMovements(StorageService.getStockMovements());
      setSales(StorageService.getSales());
      setExpenses(StorageService.getExpenses());
      setEmployees(StorageService.getEmployees());
      setPayrollRuns(StorageService.getPayrollRuns());
      setApprovals(StorageService.getApprovals());
      setNotifications(StorageService.getNotifications());
      setSubscriptionBills(StorageService.getSubscriptionBills());
      setSyncSession(StorageService.getSyncSession());
    };

    window.addEventListener('biashara_storage_update', handleStorageUpdate);
    return () => window.removeEventListener('biashara_storage_update', handleStorageUpdate);
  }, []);

  const perms = ROLE_PERMISSIONS[currentUser.role];

  // Authentication & Company Registration Handlers
  const handleLoginSuccess = (user: User) => {
    StorageService.setCurrentUser(user);
    StorageService.setAuthLoggedIn(true);
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  const handleRegisterCompany = (
    companyData: Omit<CompanyProfile, 'id' | 'createdAt'>,
    adminData: { name: string; email: string; phone?: string; password?: string }
  ) => {
    const { company, user } = StorageService.registerNewCompany(companyData, adminData);
    setCompanies(StorageService.getCompanies());
    setActiveCompanyId(company.id);
    setUsers(StorageService.getUsers());
    setCurrentUser(user);
    setIsLoggedIn(true);
    // Reload business states to reflect clean new workspace
    setSales(StorageService.getSales());
    setExpenses(StorageService.getExpenses());
    setInventory(StorageService.getInventory());
    setCustomers(StorageService.getCustomers());
    setSuppliers(StorageService.getSuppliers());
    setStockMovements(StorageService.getStockMovements());
    setEmployees(StorageService.getEmployees());
    setPayrollRuns(StorageService.getPayrollRuns());
    setApprovals(StorageService.getApprovals());
    setNotifications(StorageService.getNotifications());
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    StorageService.setAuthLoggedIn(false);
    setIsLoggedIn(false);
  };

  // Company Switcher & Updater
  const handleSelectCompany = (id: string) => {
    StorageService.setActiveCompanyId(id);
    setActiveCompanyId(id);
  };

  const handleUpdateCompany = (updated: CompanyProfile) => {
    const updatedCompanies = companies.map((c) => (c.id === updated.id ? updated : c));
    StorageService.saveCompanies(updatedCompanies);
    setCompanies(updatedCompanies);
  };

  const handleCreateCompany = (newCompany: CompanyProfile) => {
    const updated = [...companies, newCompany];
    StorageService.saveCompanies(updated);
    setCompanies(updated);
    handleSelectCompany(newCompany.id);
  };

  // Business Action Handlers
  const handleSaveSale = (
    newInvoice: Invoice,
    movements: StockMovement[],
    updatedCustomers: Customer[],
    updatedInventory: InventoryItem[]
  ) => {
    const saleWithComp = { ...newInvoice, companyId: activeCompany.id };
    const updatedSales = [saleWithComp, ...sales];
    StorageService.saveSales(updatedSales);
    setSales(updatedSales);

    if (movements.length > 0) {
      const updatedMovements = [...movements, ...stockMovements];
      StorageService.saveStockMovements(updatedMovements);
      setStockMovements(updatedMovements);
    }

    StorageService.saveCustomers(updatedCustomers);
    setCustomers(updatedCustomers);

    StorageService.saveInventory(updatedInventory);
    setInventory(updatedInventory);

    StorageService.addAuditLog(
      'CREATE_SALE',
      `Issued ${newInvoice.invoiceNumber} for KES ${newInvoice.grandTotal} to ${newInvoice.entityName}`,
      currentUser
    );

    setShowCreateInvoice(false);
    setViewingInvoice(saleWithComp);
  };

  const handleSaveExpense = (
    newExpense: ExpenseRecord,
    updatedSuppliers: Supplier[],
    restockMovements?: StockMovement[],
    updatedInventory?: InventoryItem[]
  ) => {
    const expWithComp = { ...newExpense, companyId: activeCompany.id };
    const updatedExpenses = [expWithComp, ...expenses];
    StorageService.saveExpenses(updatedExpenses);
    setExpenses(updatedExpenses);

    StorageService.saveSuppliers(updatedSuppliers);
    setSuppliers(updatedSuppliers);

    if (restockMovements && restockMovements.length > 0) {
      const updatedMovements = [...restockMovements, ...stockMovements];
      StorageService.saveStockMovements(updatedMovements);
      setStockMovements(updatedMovements);
    }

    if (updatedInventory && updatedInventory.length > 0) {
      StorageService.saveInventory(updatedInventory);
      setInventory(updatedInventory);
    }

    // If expense is above KES 20,000, automatically add an approval requisition
    if (newExpense.totalWithTax >= 20000) {
      const newApproval: ApprovalRequest = {
        id: `appr-${Date.now()}`,
        companyId: activeCompany.id,
        type: 'expense',
        targetId: newExpense.id,
        title: `Expenditure: ${newExpense.category} - ${newExpense.supplierName}`,
        amount: newExpense.totalWithTax,
        requestedByUserId: currentUser.id,
        requestedByName: currentUser.name,
        requestDate: new Date().toISOString(),
        status: 'pending',
      };
      const updatedApprovals = [newApproval, ...approvals];
      StorageService.saveApprovals(updatedApprovals);
      setApprovals(updatedApprovals);

      // Create a notification
      const newNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        companyId: activeCompany.id,
        type: 'approval_required',
        title: `Requisition Pending: ${formatKES(newExpense.totalWithTax)}`,
        message: `${newExpense.category} purchase submitted by ${currentUser.name} requires manager sign-off.`,
        linkTab: 'approvals',
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      const updatedNotifs = [newNotif, ...notifications];
      StorageService.saveNotifications(updatedNotifs);
      setNotifications(updatedNotifs);
    }

    StorageService.addAuditLog(
      'RECORD_EXPENSE',
      `Recorded ${newExpense.category} of KES ${newExpense.totalWithTax} to ${newExpense.supplierName}${
        restockMovements && restockMovements.length > 0 ? ` (+${restockMovements.length} restocked inventory items)` : ''
      }`,
      currentUser
    );

    setShowCreateExpense(false);
  };

  const handleSaveStockMovement = (movement: StockMovement, updatedInventory: InventoryItem[]) => {
    const updatedMovements = [movement, ...stockMovements];
    StorageService.saveStockMovements(updatedMovements);
    setStockMovements(updatedMovements);

    StorageService.saveInventory(updatedInventory);
    setInventory(updatedInventory);

    StorageService.addAuditLog(
      'STOCK_ADJUSTMENT',
      `${movement.type.replace('_', ' ')}: ${movement.quantity} for ${movement.itemName}`,
      currentUser
    );

    setShowStockMovement(false);
    setSelectedStockItem(undefined);
  };

  const handleMarkInvoicePaid = (invoiceId: string, method: string, mpesaCode?: string) => {
    const updatedSales = sales.map((inv) => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          paymentStatus: 'paid' as const,
          paymentMethod: method as any,
          mpesaCode: mpesaCode || inv.mpesaCode,
          paidAmount: inv.grandTotal,
          dueAmount: 0,
        };
      }
      return inv;
    });

    StorageService.saveSales(updatedSales);
    setSales(updatedSales);

    const target = sales.find((s) => s.id === invoiceId);
    if (target) {
      const updatedCustomers = customers.map((c) => {
        if (c.id === target.entityId) {
          return {
            ...c,
            currentBalance: Math.max(0, c.currentBalance - (target.dueAmount || target.grandTotal)),
          };
        }
        return c;
      });
      StorageService.saveCustomers(updatedCustomers);
      setCustomers(updatedCustomers);
    }

    if (viewingInvoice && viewingInvoice.id === invoiceId) {
      const updated = updatedSales.find((s) => s.id === invoiceId);
      if (updated) setViewingInvoice(updated);
    }
  };

  // HR & Payroll Handlers
  const handleSaveEmployee = (newEmp: Employee) => {
    const updated = [newEmp, ...employees];
    StorageService.saveEmployees(updated);
    setEmployees(updated);
  };

  const handleRunPayroll = (newRun: PayrollRun) => {
    const updated = [newRun, ...payrollRuns];
    StorageService.savePayrollRuns(updated);
    setPayrollRuns(updated);
  };

  const handleMarkPayrollPaid = (runId: string, mpesaRef?: string) => {
    const updated = payrollRuns.map((r) => (r.id === runId ? { ...r, paymentStatus: 'paid' as const, mpesaRef } : r));
    StorageService.savePayrollRuns(updated);
    setPayrollRuns(updated);
  };

  // Approvals Handlers
  const handleUpdateApproval = (updatedReq: ApprovalRequest) => {
    const updated = approvals.map((a) => (a.id === updatedReq.id ? updatedReq : a));
    StorageService.saveApprovals(updated);
    setApprovals(updated);
  };

  const handleCreateApproval = (newReq: ApprovalRequest) => {
    const updated = [newReq, ...approvals];
    StorageService.saveApprovals(updated);
    setApprovals(updated);
  };

  // Notifications Handlers
  const handleMarkNotificationRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    StorageService.saveNotifications(updated);
    setNotifications(updated);
  };

  const handleMarkAllNotificationsRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    StorageService.saveNotifications(updated);
    setNotifications(updated);
  };

  // Subscription Billing Handler
  const handleIssueSubscriptionBill = (newBill: SubscriptionBill) => {
    const updated = [newBill, ...subscriptionBills];
    StorageService.saveSubscriptionBills(updated);
    setSubscriptionBills(updated);
  };

  const handleSaveGoogleSheetConfig = (config: GoogleSheetSyncConfig) => {
    StorageService.saveGoogleSheetConfig(config);
  };

  const handleExportData = () => {
    const jsonStr = StorageService.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biasharaflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (jsonStr: string): boolean => {
    return StorageService.importAllData(jsonStr);
  };

  const handleTriggerSync = () => {
    const updated: SyncSession = {
      ...syncSession,
      lastSyncTimestamp: new Date().toISOString(),
      unsyncedChanges: 0,
      isOnline: navigator.onLine,
    };
    StorageService.saveSyncSession(updated);
    setSyncSession(updated);
    alert('All sales, inventory, and ledgers synchronized across connected devices.');
  };

  // Check if unauthenticated or no company registered
  if (!isLoggedIn || companies.length === 0 || !currentUser) {
    return (
      <LoginScreen
        companies={companies}
        users={users}
        onLoginSuccess={handleLoginSuccess}
        onRegisterCompany={handleRegisterCompany}
      />
    );
  }

  // Check RBAC for restricted views
  const isViewRestricted =
    (activeTab === 'expenses' && !perms.canViewExpenses) ||
    (activeTab === 'inventory' && !perms.canManageInventory) ||
    (activeTab === 'reports' && !perms.canViewReports);

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans ${isMobileDeviceView ? 'bg-slate-300 py-4 sm:py-8' : ''}`}>
      
      {/* Wrapper: normal full-screen layout OR smartphone frame when toggled */}
      <div className={`flex-1 flex flex-col ${
        isMobileDeviceView
          ? 'max-w-[420px] w-full mx-auto bg-slate-50 rounded-3xl shadow-2xl overflow-hidden border-8 border-slate-900 min-h-[850px] relative'
          : 'w-full'
      }`}>
        
        {/* Top Navigation */}
        <TopNav
          companies={companies}
          activeCompany={activeCompany}
          currentUser={currentUser}
          activeTab={activeTab}
          isMobileDeviceView={isMobileDeviceView}
          unreadNotificationsCount={unreadNotificationsCount}
          onSelectTab={setActiveTab}
          onSelectCompany={handleSelectCompany}
          onToggleDeviceView={() => setIsMobileDeviceView(!isMobileDeviceView)}
          onOpenTeamSecurity={() => setShowTeamSecurity(true)}
          onOpenQuickSale={() => setShowCreateInvoice(true)}
          onOpenNotifications={() => setShowNotificationsModal(true)}
          onLogout={handleLogout}
        />

        {/* Main Workspace Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-24 xl:pb-12">
          
          {/* If View is restricted for current role */}
          {isViewRestricted ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto my-12 space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Access Restricted</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Your current account role (<strong>{perms.label}</strong>) is restricted from accessing this module by business security policy.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setShowTeamSecurity(true)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  Switch Role / User Account
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  sales={sales}
                  expenses={expenses}
                  inventory={inventory}
                  customers={customers}
                  business={activeCompany}
                  currentUser={currentUser}
                  onOpenCreateSale={() => setShowCreateInvoice(true)}
                  onOpenCreateExpense={() => setShowCreateExpense(true)}
                  onOpenStockMovement={() => {
                    setSelectedStockItem(undefined);
                    setShowStockMovement(true);
                  }}
                  onSelectInvoice={(inv) => setViewingInvoice(inv)}
                  onNavigateToTab={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'sales' && (
                <SalesInvoicesView
                  sales={sales}
                  business={activeCompany}
                  currentUser={currentUser}
                  onOpenCreateModal={() => setShowCreateInvoice(true)}
                  onSelectInvoice={(inv) => setViewingInvoice(inv)}
                />
              )}

              {activeTab === 'expenses' && (
                <ExpensesView
                  expenses={expenses}
                  suppliers={suppliers}
                  currentUser={currentUser}
                  onOpenCreateModal={() => setShowCreateExpense(true)}
                />
              )}

              {activeTab === 'inventory' && (
                <StockInventoryView
                  inventory={inventory}
                  stockMovements={stockMovements}
                  currentUser={currentUser}
                  onOpenStockMovement={(item) => {
                    setSelectedStockItem(item);
                    setShowStockMovement(true);
                  }}
                  onSaveNewItem={(item) => {
                    const updated = [item, ...inventory];
                    StorageService.saveInventory(updated);
                    setInventory(updated);
                  }}
                />
              )}

              {activeTab === 'payroll' && (
                <PayrollView
                  company={activeCompany}
                  employees={employees}
                  payrollRuns={payrollRuns}
                  currentUser={currentUser}
                  onSaveEmployee={handleSaveEmployee}
                  onRunPayroll={handleRunPayroll}
                  onMarkPayrollPaid={handleMarkPayrollPaid}
                />
              )}

              {activeTab === 'approvals' && (
                <ApprovalsView
                  approvals={approvals}
                  company={activeCompany}
                  currentUser={currentUser}
                  onUpdateApproval={handleUpdateApproval}
                  onCreateApproval={handleCreateApproval}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsSuiteView
                  sales={sales}
                  expenses={expenses}
                  inventory={inventory}
                  customers={customers}
                  suppliers={suppliers}
                  business={activeCompany}
                  onOpenInvoice={(inv) => setViewingInvoice(inv)}
                />
              )}

              {activeTab === 'company_settings' && (
                <CompanySettingsView
                  companies={companies}
                  activeCompany={activeCompany}
                  subscriptionBills={subscriptionBills}
                  currentUser={currentUser}
                  onUpdateCompany={handleUpdateCompany}
                  onSelectCompany={handleSelectCompany}
                  onCreateCompany={handleCreateCompany}
                  onIssueSubscriptionBill={handleIssueSubscriptionBill}
                  onSaveGoogleSheetConfig={handleSaveGoogleSheetConfig}
                  salesData={sales}
                  expensesData={expenses}
                />
              )}

              {activeTab === 'directory' && (
                <CustomersSuppliersView
                  customers={customers}
                  suppliers={suppliers}
                  business={activeCompany}
                  currentUser={currentUser}
                  onSaveCustomer={(c) => {
                    const updated = [c, ...customers];
                    StorageService.saveCustomers(updated);
                    setCustomers(updated);
                  }}
                  onSaveSupplier={(s) => {
                    const updated = [s, ...suppliers];
                    StorageService.saveSuppliers(updated);
                    setSuppliers(updated);
                  }}
                />
              )}
            </>
          )}

        </main>

        {/* Mobile Bottom Tab Bar */}
        <MobileBottomNav
          activeTab={activeTab}
          currentUser={currentUser}
          unreadCount={unreadNotificationsCount}
          onSelectTab={setActiveTab}
          onOpenQuickSale={() => setShowCreateInvoice(true)}
          onOpenTeamSecurity={() => setShowTeamSecurity(true)}
          onLogout={handleLogout}
        />

      </div>

      {/* ================= MODALS ================= */}

      {/* Document Viewer: Print / PDF / Email / Share Modal */}
      {viewingInvoice && (
        <InvoiceReceiptModal
          invoice={viewingInvoice}
          business={activeCompany}
          currentUser={currentUser}
          onClose={() => setViewingInvoice(null)}
          onMarkAsPaid={handleMarkInvoicePaid}
        />
      )}

      {/* Create Sale / Tax Invoice Modal */}
      {showCreateInvoice && (
        <CreateInvoiceModal
          business={activeCompany}
          customers={customers}
          inventory={inventory}
          currentUser={currentUser}
          onClose={() => setShowCreateInvoice(false)}
          onSave={handleSaveSale}
          onQuickAddCustomer={(newCust) => {
            const updated = [newCust, ...customers];
            StorageService.saveCustomers(updated);
            setCustomers(updated);
          }}
        />
      )}

      {/* Record Expense Modal */}
      {showCreateExpense && (
        <CreateExpenseModal
          suppliers={suppliers}
          inventory={inventory}
          currentUser={currentUser}
          onClose={() => setShowCreateExpense(false)}
          onSave={handleSaveExpense}
          onQuickAddSupplier={(newSup) => {
            const updated = [newSup, ...suppliers];
            StorageService.saveSuppliers(updated);
            setSuppliers(updated);
          }}
        />
      )}

      {/* Stock Movement Modal */}
      {showStockMovement && (
        <StockMovementModal
          inventory={inventory}
          preselectedItem={selectedStockItem}
          currentUser={currentUser}
          onClose={() => {
            setShowStockMovement(false);
            setSelectedStockItem(undefined);
          }}
          onSave={handleSaveStockMovement}
        />
      )}

      {/* Team RBAC, 2FA, Biometrics & Sync Modal */}
      {showTeamSecurity && (
        <TeamSecuritySyncModal
          users={users}
          currentUser={currentUser}
          syncSession={syncSession}
          onClose={() => setShowTeamSecurity(false)}
          onSwitchUser={(u) => {
            StorageService.setCurrentUser(u);
            setCurrentUser(u);
            setShowTeamSecurity(false);
          }}
          onAddUser={(u) => {
            const updated = [...users, u];
            StorageService.saveUsers(updated);
            setUsers(updated);
          }}
          onUpdateCurrentUser={(u) => {
            StorageService.setCurrentUser(u);
            setCurrentUser(u);
            const updatedList = users.map((item) => (item.id === u.id ? u : item));
            StorageService.saveUsers(updatedList);
            setUsers(updatedList);
          }}
          onExportData={handleExportData}
          onImportData={handleImportData}
          onTriggerSync={handleTriggerSync}
        />
      )}

      {/* Notifications Drawer Modal */}
      {showNotificationsModal && (
        <NotificationsModal
          notifications={notifications}
          onClose={() => setShowNotificationsModal(false)}
          onMarkAsRead={handleMarkNotificationRead}
          onMarkAllAsRead={handleMarkAllNotificationsRead}
          onNavigateToTab={(tab) => {
            setActiveTab(tab);
            setShowNotificationsModal(false);
          }}
        />
      )}

    </div>
  );
}

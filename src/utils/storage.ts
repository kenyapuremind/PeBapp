/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AppNotification,
  ApprovalRequest,
  AuditLog,
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
} from '../types';

const STORAGE_KEYS = {
  AUTH_LOGGED_IN: 'biashara_auth_logged_in',
  CURRENT_USER: 'biashara_current_user',
  USERS: 'biashara_users',
  COMPANIES: 'biashara_companies',
  ACTIVE_COMPANY_ID: 'biashara_active_company_id',
  CUSTOMERS: 'biashara_customers',
  SUPPLIERS: 'biashara_suppliers',
  INVENTORY: 'biashara_inventory',
  MOVEMENTS: 'biashara_stock_movements',
  SALES: 'biashara_sales_invoices',
  EXPENSES: 'biashara_expenses',
  EMPLOYEES: 'biashara_employees',
  PAYROLL: 'biashara_payroll_runs',
  APPROVALS: 'biashara_approvals',
  NOTIFICATIONS: 'biashara_notifications',
  SUBSCRIPTIONS: 'biashara_subscriptions',
  GSHEET_CONFIG: 'biashara_gsheet_config',
  AUDIT_LOGS: 'biashara_audit_logs',
  SYNC: 'biashara_sync_session',
};

// Fallback templates when no records exist yet
export const DEFAULT_COMPANY_FALLBACK: CompanyProfile = {
  id: 'comp-main',
  name: 'My Business Enterprise',
  tradingName: 'Main Office',
  kraPin: 'P000000000A',
  phone: '+254 700 000 000',
  email: 'info@business.co.ke',
  address: 'Commercial Street',
  city: 'Nairobi',
  country: 'Kenya',
  currency: 'KES',
  defaultTaxRate: 16,
  defaultTaxMode: 'exclusive',
  invoicePrefix: 'INV-2026-',
  receiptPrefix: 'RCT-2026-',
  invoiceFooterNote: 'Payment terms: Due upon receipt. Default currency: KES.',
  subscriptionPlan: 'starter',
  subscriptionStatus: 'active',
  subscriptionExpiry: '2027-12-31T00:00:00Z',
  monthlyFee: 0,
  createdAt: new Date().toISOString(),
};

export const DEFAULT_USER_FALLBACK: User = {
  id: 'usr-admin',
  name: 'Administrator',
  email: 'admin@business.co.ke',
  role: 'owner',
  phone: '+254 700 000 000',
  twoFactorEnabled: false,
  biometricRegistered: false,
  createdAt: new Date().toISOString(),
};

// Clean initial empty arrays (zero sample/dummy records)
export const INITIAL_COMPANIES: CompanyProfile[] = [];
export const INITIAL_USERS: User[] = [];
export const INITIAL_EMPLOYEES: Employee[] = [];
export const INITIAL_PAYROLL_RUNS: PayrollRun[] = [];
export const INITIAL_APPROVALS: ApprovalRequest[] = [];
export const INITIAL_NOTIFICATIONS: AppNotification[] = [];
export const INITIAL_SUBSCRIPTION_BILLS: SubscriptionBill[] = [];

// Automatic migration: purge previous dummy demo seeds from localStorage if found
function purgeLegacyDemoDataIfNeeded() {
  try {
    const rawCompanies = localStorage.getItem(STORAGE_KEYS.COMPANIES);
    if (rawCompanies && (rawCompanies.includes('BiasharaFlow Agro') || rawCompanies.includes('P051892341M') || rawCompanies.includes('comp-1'))) {
      localStorage.clear();
      return;
    }
    const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    if (rawUsers && (rawUsers.includes('david.kamau@biasharaflow.co.ke') || rawUsers.includes('usr-1'))) {
      localStorage.clear();
      return;
    }
    const rawCust = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (rawCust && (rawCust.includes('GreenValley Agro') || rawCust.includes('Apex Modern Builders'))) {
      localStorage.clear();
    }
  } catch (err) {
    // Ignore in non-browser context
  }
}
purgeLegacyDemoDataIfNeeded();

// Helper to get from local storage or set default
function getStored<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(item) as T;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage`, err);
    return defaultVal;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('biashara_storage_update'));
  } catch (err) {
    console.error(`Error writing ${key} to localStorage`, err);
  }
}

export const StorageService = {
  // Authentication & Session
  isUserLoggedIn(): boolean {
    const companies = this.getCompanies();
    const users = this.getUsers();
    if (companies.length === 0 || users.length === 0) {
      return false;
    }
    return getStored<boolean>(STORAGE_KEYS.AUTH_LOGGED_IN, false);
  },

  setAuthLoggedIn(isLoggedIn: boolean): void {
    setStored(STORAGE_KEYS.AUTH_LOGGED_IN, isLoggedIn);
  },

  getCurrentUser(): User {
    const users = this.getUsers();
    const stored = getStored<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (stored && users.some((u) => u.id === stored.id)) return stored;
    return users[0] || DEFAULT_USER_FALLBACK;
  },

  setCurrentUser(user: User): void {
    setStored(STORAGE_KEYS.CURRENT_USER, user);
  },

  getUsers(): User[] {
    return getStored<User[]>(STORAGE_KEYS.USERS, []);
  },

  saveUsers(users: User[]): void {
    setStored(STORAGE_KEYS.USERS, users);
  },

  // Multi-Company Management
  getCompanies(): CompanyProfile[] {
    return getStored<CompanyProfile[]>(STORAGE_KEYS.COMPANIES, []);
  },

  saveCompanies(companies: CompanyProfile[]): void {
    setStored(STORAGE_KEYS.COMPANIES, companies);
  },

  getActiveCompanyId(): string {
    const companies = this.getCompanies();
    return getStored<string>(STORAGE_KEYS.ACTIVE_COMPANY_ID, companies[0]?.id || DEFAULT_COMPANY_FALLBACK.id);
  },

  setActiveCompanyId(companyId: string): void {
    setStored(STORAGE_KEYS.ACTIVE_COMPANY_ID, companyId);
  },

  getActiveCompany(): CompanyProfile {
    const companies = this.getCompanies();
    const activeId = this.getActiveCompanyId();
    return companies.find((c) => c.id === activeId) || companies[0] || DEFAULT_COMPANY_FALLBACK;
  },

  updateCompany(updated: CompanyProfile): void {
    const companies = this.getCompanies().map((c) => (c.id === updated.id ? updated : c));
    this.saveCompanies(companies);
  },

  // Register New Company & Setup Admin Flow
  registerNewCompany(
    companyData: Omit<CompanyProfile, 'id' | 'createdAt'>,
    adminUserData: { name: string; email: string; phone?: string; password?: string }
  ): { company: CompanyProfile; user: User } {
    const companyId = `comp-${Date.now()}`;
    const userId = `usr-${Date.now()}`;

    const newCompany: CompanyProfile = {
      ...companyData,
      id: companyId,
      createdAt: new Date().toISOString(),
    };

    const newAdminUser: User = {
      id: userId,
      name: adminUserData.name.trim(),
      email: adminUserData.email.trim().toLowerCase(),
      phone: adminUserData.phone?.trim() || newCompany.phone,
      role: 'owner',
      twoFactorEnabled: false,
      biometricRegistered: false,
      createdAt: new Date().toISOString(),
    };

    const existingCompanies = this.getCompanies().filter((c) => c.id !== companyId);
    const updatedCompanies = [...existingCompanies, newCompany];
    this.saveCompanies(updatedCompanies);
    this.setActiveCompanyId(companyId);

    const existingUsers = this.getUsers().filter((u) => u.id !== userId);
    const updatedUsers = [...existingUsers, newAdminUser];
    this.saveUsers(updatedUsers);
    this.setCurrentUser(newAdminUser);
    this.setAuthLoggedIn(true);

    // Initial welcome notification
    const welcomeNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      companyId: companyId,
      type: 'system',
      title: `Company Registered: ${newCompany.name}`,
      message: `Welcome to BiasharaFlow ERP! Workspace created. You can now issue tax invoices, register stock inventory, manage customers, and record expenses.`,
      linkTab: 'dashboard',
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.saveNotifications([welcomeNotif]);

    this.addAuditLog(
      'REGISTER_COMPANY',
      `Registered company ${newCompany.name} (KRA PIN: ${newCompany.kraPin || 'N/A'}) with administrator ${newAdminUser.name}`,
      newAdminUser
    );

    return { company: newCompany, user: newAdminUser };
  },

  // Compatibility with existing code
  getBusiness(): CompanyProfile {
    return this.getActiveCompany();
  },

  saveBusiness(profile: CompanyProfile): void {
    this.updateCompany(profile);
  },

  // Employees & Payroll
  getEmployees(): Employee[] {
    return getStored<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
  },

  saveEmployees(employees: Employee[]): void {
    setStored(STORAGE_KEYS.EMPLOYEES, employees);
  },

  getPayrollRuns(): PayrollRun[] {
    return getStored<PayrollRun[]>(STORAGE_KEYS.PAYROLL, []);
  },

  savePayrollRuns(runs: PayrollRun[]): void {
    setStored(STORAGE_KEYS.PAYROLL, runs);
  },

  // Approval Workflows
  getApprovals(): ApprovalRequest[] {
    return getStored<ApprovalRequest[]>(STORAGE_KEYS.APPROVALS, []);
  },

  saveApprovals(approvals: ApprovalRequest[]): void {
    setStored(STORAGE_KEYS.APPROVALS, approvals);
  },

  // Notifications
  getNotifications(): AppNotification[] {
    return getStored<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  },

  saveNotifications(notifs: AppNotification[]): void {
    setStored(STORAGE_KEYS.NOTIFICATIONS, notifs);
  },

  // Subscription Bills (SaaS admin)
  getSubscriptionBills(): SubscriptionBill[] {
    return getStored<SubscriptionBill[]>(STORAGE_KEYS.SUBSCRIPTIONS, []);
  },

  saveSubscriptionBills(bills: SubscriptionBill[]): void {
    setStored(STORAGE_KEYS.SUBSCRIPTIONS, bills);
  },

  // Google Sheets Sync Config
  getGoogleSheetConfig(): GoogleSheetSyncConfig {
    return getStored<GoogleSheetSyncConfig>(STORAGE_KEYS.GSHEET_CONFIG, {
      webhookUrl: 'https://script.google.com/macros/s/AKfycbxBiasharaFlowSync/exec',
      autoSync: false,
      lastSyncTime: '',
      sheetId: '',
    });
  },

  saveGoogleSheetConfig(config: GoogleSheetSyncConfig): void {
    setStored(STORAGE_KEYS.GSHEET_CONFIG, config);
  },

  // Core Data - 100% clean initial states
  getCustomers(): Customer[] {
    return getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  },

  saveCustomers(customers: Customer[]): void {
    setStored(STORAGE_KEYS.CUSTOMERS, customers);
  },

  getSuppliers(): Supplier[] {
    return getStored<Supplier[]>(STORAGE_KEYS.SUPPLIERS, []);
  },

  saveSuppliers(suppliers: Supplier[]): void {
    setStored(STORAGE_KEYS.SUPPLIERS, suppliers);
  },

  getInventory(): InventoryItem[] {
    return getStored<InventoryItem[]>(STORAGE_KEYS.INVENTORY, []);
  },

  saveInventory(items: InventoryItem[]): void {
    setStored(STORAGE_KEYS.INVENTORY, items);
  },

  getStockMovements(): StockMovement[] {
    return getStored<StockMovement[]>(STORAGE_KEYS.MOVEMENTS, []);
  },

  saveStockMovements(movements: StockMovement[]): void {
    setStored(STORAGE_KEYS.MOVEMENTS, movements);
  },

  getSales(): Invoice[] {
    return getStored<Invoice[]>(STORAGE_KEYS.SALES, []);
  },

  saveSales(sales: Invoice[]): void {
    setStored(STORAGE_KEYS.SALES, sales);
  },

  getExpenses(): ExpenseRecord[] {
    return getStored<ExpenseRecord[]>(STORAGE_KEYS.EXPENSES, []);
  },

  saveExpenses(expenses: ExpenseRecord[]): void {
    setStored(STORAGE_KEYS.EXPENSES, expenses);
  },

  getAuditLogs(): AuditLog[] {
    return getStored<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  },

  addAuditLog(action: string, details: string, user: User): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      role: user.role,
      action,
      details,
    };
    this.saveAuditLogs([newLog, ...logs].slice(0, 500));
  },

  saveAuditLogs(logs: AuditLog[]): void {
    setStored(STORAGE_KEYS.AUDIT_LOGS, logs);
  },

  getSyncSession(): SyncSession {
    return getStored<SyncSession>(STORAGE_KEYS.SYNC, {
      lastSyncTimestamp: new Date().toISOString(),
      deviceId: `device-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      syncToken: 'BF-SYNC-KENYA-94821',
      isOnline: navigator.onLine,
      unsyncedChanges: 0,
    });
  },

  saveSyncSession(sync: SyncSession): void {
    setStored(STORAGE_KEYS.SYNC, sync);
  },

  exportAllData(): string {
    const payload = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      companies: this.getCompanies(),
      users: this.getUsers(),
      employees: this.getEmployees(),
      payroll: this.getPayrollRuns(),
      approvals: this.getApprovals(),
      notifications: this.getNotifications(),
      subscriptions: this.getSubscriptionBills(),
      customers: this.getCustomers(),
      suppliers: this.getSuppliers(),
      inventory: this.getInventory(),
      stockMovements: this.getStockMovements(),
      sales: this.getSales(),
      expenses: this.getExpenses(),
      auditLogs: this.getAuditLogs(),
    };
    return JSON.stringify(payload, null, 2);
  },

  importAllData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.companies) this.saveCompanies(data.companies);
      if (data.users) this.saveUsers(data.users);
      if (data.employees) this.saveEmployees(data.employees);
      if (data.payroll) this.savePayrollRuns(data.payroll);
      if (data.approvals) this.saveApprovals(data.approvals);
      if (data.notifications) this.saveNotifications(data.notifications);
      if (data.subscriptions) this.saveSubscriptionBills(data.subscriptions);
      if (data.customers) this.saveCustomers(data.customers);
      if (data.suppliers) this.saveSuppliers(data.suppliers);
      if (data.inventory) this.saveInventory(data.inventory);
      if (data.stockMovements) this.saveStockMovements(data.stockMovements);
      if (data.sales) this.saveSales(data.sales);
      if (data.expenses) this.saveExpenses(data.expenses);
      if (data.auditLogs) this.saveAuditLogs(data.auditLogs);
      return true;
    } catch (err) {
      console.error('Import failed', err);
      return false;
    }
  },
};

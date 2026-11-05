/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'owner' | 'manager' | 'cashier' | 'accountant' | 'inventory_clerk';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatar?: string;
  provider?: 'email' | 'google' | 'apple' | 'microsoft' | 'x';
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  biometricRegistered: boolean;
  biometricCredentialId?: string;
  createdAt: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  tradingName: string;
  kraPin: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  currency: string;
  defaultTaxRate: number; // e.g. 16 for 16% KRA VAT
  defaultTaxMode: 'exclusive' | 'inclusive';
  mpesaTillNumber?: string;
  mpesaPaybillNumber?: string;
  mpesaAccountNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  invoicePrefix: string;
  receiptPrefix: string;
  invoiceFooterNote: string;
  logoUrl?: string;
  subscriptionPlan: 'starter' | 'growth' | 'enterprise';
  subscriptionStatus: 'active' | 'trial' | 'past_due' | 'cancelled';
  subscriptionExpiry: string;
  monthlyFee: number;
  createdAt: string;
}

export type BusinessProfile = CompanyProfile;

export interface Employee {
  id: string;
  companyId: string;
  name: string;
  nationalId: string;
  kraPin: string;
  phone: string;
  email: string;
  department: string;
  position: string;
  hireDate: string;
  basicSalary: number;
  houseAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  nssfNumber?: string;
  nhifNumber?: string;
  paymentMethod: 'mpesa' | 'bank';
  mpesaPhone?: string;
  bankName?: string;
  bankAccount?: string;
  status: 'active' | 'on_leave' | 'terminated';
}

export interface PayrollRun {
  id: string;
  companyId: string;
  month: string; // e.g. "March 2026"
  year: number;
  payDate: string;
  employeeId: string;
  employeeName: string;
  employeePosition: string;
  employeeKraPin: string;
  basicSalary: number;
  totalAllowances: number;
  grossSalary: number;
  nssfDeduction: number;
  nhifShifDeduction: number;
  payeTax: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  paymentStatus: 'paid' | 'pending';
  paymentMethod: 'mpesa' | 'bank';
  mpesaRef?: string;
  createdAt: string;
}

export type ApprovalType = 'expense' | 'credit_sale' | 'discount' | 'payroll';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalRequest {
  id: string;
  companyId: string;
  type: ApprovalType;
  targetId: string;
  title: string;
  amount: number;
  requestedByUserId: string;
  requestedByName: string;
  requestDate: string;
  status: ApprovalStatus;
  reviewedByUserId?: string;
  reviewedByName?: string;
  reviewDate?: string;
  reviewNotes?: string;
}

export type NotificationType = 'low_stock' | 'overdue_invoice' | 'approval_required' | 'payroll_due' | 'system';

export interface AppNotification {
  id: string;
  companyId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkTab?: string;
  isRead: boolean;
  createdAt: string;
}

export interface SubscriptionBill {
  id: string;
  companyId: string;
  companyName: string;
  planName: 'Starter SME' | 'Growth Enterprise' | 'Corporate Multi-Branch';
  amount: number;
  billingCycle: 'Monthly' | 'Annual';
  issueDate: string;
  dueDate: string;
  paymentStatus: 'paid' | 'overdue' | 'pending';
  mpesaCode?: string;
  notes?: string;
}

export interface GoogleSheetSyncConfig {
  webhookUrl: string;
  autoSync: boolean;
  lastSyncTime?: string;
  sheetId?: string;
}

export interface Customer {
  id: string;
  companyId?: string;
  name: string;
  phone: string;
  email: string;
  kraPin?: string;
  address?: string;
  creditLimit: number;
  currentBalance: number; // Positive means customer owes business (Receivable)
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  companyId?: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email: string;
  kraPin?: string;
  address?: string;
  currentBalance: number; // Positive means business owes supplier (Payable)
  paymentTerms?: string;
  bankOrMpesaDetails?: string;
  createdAt: string;
}

export type ItemType = 'product' | 'service';

export interface InventoryItem {
  id: string;
  companyId?: string;
  name: string;
  sku: string;
  type: ItemType;
  category: string;
  unit: string; // e.g. Pcs, Kg, Litres, Box, Hours, Service
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  reorderLevel: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export type MovementType = 'inward_purchase' | 'outward_sale' | 'adjustment_damaged' | 'adjustment_return' | 'adjustment_count';

export interface StockMovement {
  id: string;
  companyId?: string;
  itemId: string;
  itemName: string;
  type: MovementType;
  quantity: number; // Absolute quantity moved
  previousStock: number;
  newStock: number;
  unitCost: number;
  reference?: string; // e.g. INV-1002, PO-4001, Physical Count
  notes?: string;
  date: string;
  createdBy: string;
}

export type PaymentMethod = 'mpesa' | 'cash' | 'bank' | 'credit' | 'card';
export type PaymentStatus = 'paid' | 'partial' | 'unpaid';
export type TaxMode = 'exclusive' | 'inclusive';

export interface InvoiceLineItem {
  itemId: string;
  name: string;
  type: ItemType;
  quantity: number;
  unitPrice: number;
  costPrice: number; // to compute COGS and Gross Margin
  unit: string;
  discountPercent: number;
  taxRatePercent: number; // e.g. 16% or 0%
  taxAmount: number;
  lineTotal: number;
}

export interface Invoice {
  id: string;
  companyId?: string;
  type: 'sale' | 'expense';
  invoiceNumber: string;
  receiptNumber?: string;
  entityId: string; // customerId or supplierId
  entityName: string;
  entityPhone?: string;
  entityEmail?: string;
  entityKraPin?: string;
  date: string;
  dueDate: string;
  items: InvoiceLineItem[];
  subtotal: number;
  discountTotal: number;
  taxRatePercent: number;
  taxMode: TaxMode;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  mpesaCode?: string;
  notes?: string;
  approvalStatus?: ApprovalStatus;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface ExpenseItemLine {
  itemId: string;
  itemName: string;
  quantity: number;
  unitCost: number;
  unit?: string;
  lineTotal: number;
}

export interface ExpenseRecord {
  id: string;
  companyId?: string;
  billNumber?: string;
  supplierId?: string;
  supplierName: string;
  category: 'Rent' | 'Utilities' | 'Salaries & Wages' | 'Inventory Purchase' | 'Fuel & Transport' | 'Marketing & Ads' | 'Repairs & Maintenance' | 'Taxes & Licenses' | 'Internet & Communication' | 'Office Supplies' | 'Miscellaneous';
  date: string;
  dueDate?: string;
  description: string;
  amount: number;
  taxRatePercent: number;
  taxMode: TaxMode;
  taxAmount: number;
  totalWithTax: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'pending';
  paidAmount: number;
  mpesaCode?: string;
  notes?: string;
  restockItems?: ExpenseItemLine[];
  approvalStatus?: ApprovalStatus;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  account: string;
  accountCategory: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  debit: number;
  credit: number;
  balance: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  details: string;
}

export interface SyncSession {
  lastSyncTimestamp: string;
  deviceId: string;
  syncToken: string;
  isOnline: boolean;
  unsyncedChanges: number;
}

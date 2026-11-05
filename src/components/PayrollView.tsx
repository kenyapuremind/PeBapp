/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  DollarSign,
  Plus,
  Printer,
  Download,
  Share2,
  Mail,
  MessageSquare,
  CheckCircle,
  Clock,
  Search,
  FileText,
  X,
  Smartphone,
  Building,
} from 'lucide-react';
import { CompanyProfile, Employee, PayrollRun, User } from '../types';
import { calculateKenyanPayroll } from '../utils/payroll';
import { formatDate, formatDateTime, formatKES, generateWhatsAppLink } from '../utils/formatters';
import { downloadElementAsPDF, exportToCSV, shareElementWithAutoAttachedPDF } from '../utils/pdfGenerator';

interface PayrollViewProps {
  company: CompanyProfile;
  employees: Employee[];
  payrollRuns: PayrollRun[];
  currentUser: User;
  onSaveEmployee: (employee: Employee) => void;
  onRunPayroll: (run: PayrollRun) => void;
  onMarkPayrollPaid: (runId: string, mpesaRef?: string) => void;
}

export const PayrollView: React.FC<PayrollViewProps> = ({
  company,
  employees,
  payrollRuns,
  currentUser,
  onSaveEmployee,
  onRunPayroll,
  onMarkPayrollPaid,
}) => {
  const [activeTab, setActiveTab] = useState<'runs' | 'employees'>('runs');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showRunPayrollModal, setShowRunPayrollModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRun | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // New Employee Form State
  const [empName, setEmpName] = useState('');
  const [empNationalId, setEmpNationalId] = useState('');
  const [empKraPin, setEmpKraPin] = useState('');
  const [empPhone, setEmpPhone] = useState('+254 ');
  const [empEmail, setEmpEmail] = useState('');
  const [empDepartment, setEmpDepartment] = useState('Sales & Showroom');
  const [empPosition, setEmpPosition] = useState('Staff Representative');
  const [empBasic, setEmpBasic] = useState<number>(35000);
  const [empHouse, setEmpHouse] = useState<number>(7500);
  const [empTransport, setEmpTransport] = useState<number>(4000);
  const [empPaymentMethod, setEmpPaymentMethod] = useState<'mpesa' | 'bank'>('mpesa');

  // Run Payroll Form State
  const [runMonth, setRunMonth] = useState('March 2026');
  const [selectedEmpId, setSelectedEmpId] = useState<string>(employees[0]?.id || '');
  const [otherDeductions, setOtherDeductions] = useState<number>(0);

  const filteredEmployees = employees.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return e.name.toLowerCase().includes(q) || e.department.toLowerCase().includes(q) || e.phone.includes(q);
  });

  const filteredRuns = payrollRuns.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.employeeName.toLowerCase().includes(q) || r.month.toLowerCase().includes(q);
  });

  const totalMonthlyPayroll = payrollRuns.reduce((sum, r) => sum + r.netPay, 0);
  const totalPayeRemitted = payrollRuns.reduce((sum, r) => sum + r.payeTax, 0);
  const totalNssfRemitted = payrollRuns.reduce((sum, r) => sum + r.nssfDeduction, 0);

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim()) return;

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      companyId: company.id,
      name: empName.trim(),
      nationalId: empNationalId.trim(),
      kraPin: empKraPin.trim().toUpperCase(),
      phone: empPhone.trim(),
      email: empEmail.trim(),
      department: empDepartment,
      position: empPosition,
      hireDate: new Date().toISOString().slice(0, 10),
      basicSalary: empBasic,
      houseAllowance: empHouse,
      transportAllowance: empTransport,
      otherAllowances: 0,
      paymentMethod: empPaymentMethod,
      mpesaPhone: empPaymentMethod === 'mpesa' ? empPhone.trim() : undefined,
      status: 'active',
    };

    onSaveEmployee(newEmp);
    setShowAddEmployee(false);
    setEmpName('');
  };

  const handleExecutePayroll = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === selectedEmpId);
    if (!emp) return;

    const calc = calculateKenyanPayroll(emp, otherDeductions);

    const newRun: PayrollRun = {
      id: `pay-${Date.now()}`,
      companyId: company.id,
      month: runMonth,
      year: new Date().getFullYear(),
      payDate: new Date().toISOString().slice(0, 10),
      employeeId: emp.id,
      employeeName: emp.name,
      employeePosition: emp.position,
      employeeKraPin: emp.kraPin,
      basicSalary: calc.basicSalary,
      totalAllowances: calc.totalAllowances,
      grossSalary: calc.grossSalary,
      nssfDeduction: calc.nssfDeduction,
      nhifShifDeduction: calc.nhifShifDeduction,
      payeTax: calc.netPaye,
      otherDeductions: otherDeductions,
      totalDeductions: calc.totalDeductions,
      netPay: calc.netPay,
      paymentStatus: 'paid',
      paymentMethod: emp.paymentMethod,
      mpesaRef: emp.paymentMethod === 'mpesa' ? `B2C-${Date.now().toString().slice(-6)}` : undefined,
      createdAt: new Date().toISOString(),
    };

    onRunPayroll(newRun);
    setShowRunPayrollModal(false);
    setSelectedPayslip(newRun); // show payslip modal immediately!
  };

  const handleDownloadPayslipPDF = async () => {
    if (!selectedPayslip) return;
    setIsGeneratingPDF(true);
    await downloadElementAsPDF('printable-payslip', `Payslip-${selectedPayslip.employeeName.replace(/\s+/g, '_')}-${selectedPayslip.month}.pdf`);
    setIsGeneratingPDF(false);
  };

  const handleSharePayslip = async () => {
    if (!selectedPayslip) return;
    const emp = employees.find((e) => e.id === selectedPayslip.employeeId);
    const filename = `Payslip-${selectedPayslip.employeeName.replace(/\s+/g, '_')}-${selectedPayslip.month}.pdf`;
    const shareText = `Official Payslip for ${selectedPayslip.employeeName} (${selectedPayslip.month}) from ${company.name}.\nNet Salary Dispatched: ${formatKES(selectedPayslip.netPay)}`;
    
    await shareElementWithAutoAttachedPDF({
      elementId: 'printable-payslip',
      title: `${company.name} Payslip - ${selectedPayslip.month}`,
      text: shareText,
      filename,
    });
  };

  const handleExportPayrollCSV = () => {
    const data = payrollRuns.map((r) => ({
      Month: r.month,
      PayDate: r.payDate,
      Employee: r.employeeName,
      Position: r.employeePosition,
      KraPin: r.employeeKraPin,
      BasicSalary: r.basicSalary,
      Allowances: r.totalAllowances,
      GrossSalary: r.grossSalary,
      NSSF: r.nssfDeduction,
      SHIF_NHIF: r.nhifShifDeduction,
      PAYE_Tax: r.payeTax,
      NetPay: r.netPay,
      PaymentStatus: r.paymentStatus,
      PaymentMethod: r.paymentMethod,
      MpesaRef: r.mpesaRef || '',
    }));
    exportToCSV(data, `Payroll-Report-${company.name.replace(/\s+/g, '_')}.csv`);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            Human Resources & Kenyan Statutory Payroll
          </span>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Staff Directory, Payroll Runs & Payslips
          </h2>
          <p className="text-xs text-slate-500">
            Automated Kenyan PAYE, NSSF Tier I & II, SHIF (2.75%), and downloadable payslip PDFs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPayrollCSV}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowRunPayrollModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-transform active:scale-[0.98]"
          >
            <DollarSign className="w-4 h-4" />
            <span>+ Run Monthly Payroll</span>
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Net Disbursed</span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">{formatKES(totalMonthlyPayroll)}</div>
          <span className="text-[10px] text-slate-500">{payrollRuns.length} payroll disbursements</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">KRA PAYE Tax Deducted</span>
          <div className="text-xl font-bold font-mono text-emerald-800 mt-1">{formatKES(totalPayeRemitted)}</div>
          <span className="text-[10px] text-slate-500">Graduated tax bands + Personal Relief</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">NSSF & SHIF Deductions</span>
          <div className="text-xl font-bold font-mono text-purple-800 mt-1">{formatKES(totalNssfRemitted)}</div>
          <span className="text-[10px] text-slate-500">Social security & health funds</span>
        </div>
      </div>

      {/* Segmented Tab Navigation & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('runs')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'runs' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Payroll Runs ({payrollRuns.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('employees')}
            className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'employees' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Employees ({employees.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search employee, month, PIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 rounded-xl border border-slate-300 focus:bg-white"
          />
        </div>
      </div>

      {/* Tab 1: Payroll Runs Table */}
      {activeTab === 'runs' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Period / Date</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4 text-right">Gross Salary</th>
                  <th className="py-3 px-4 text-right">NSSF</th>
                  <th className="py-3 px-4 text-right">SHIF</th>
                  <th className="py-3 px-4 text-right">PAYE</th>
                  <th className="py-3 px-4 text-right">Net Pay (KES)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Payslip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredRuns.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-sans whitespace-nowrap">
                      <div className="font-bold text-slate-900">{r.month}</div>
                      <div className="text-[10px] text-slate-400">{formatDate(r.payDate)}</div>
                    </td>

                    <td className="py-3 px-4 font-sans">
                      <div className="font-semibold text-slate-900">{r.employeeName}</div>
                      <div className="text-[10px] text-slate-400">{r.employeePosition} · PIN: {r.employeeKraPin}</div>
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums text-slate-700">
                      {formatKES(r.grossSalary)}
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums text-slate-500">
                      {formatKES(r.nssfDeduction)}
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums text-slate-500">
                      {formatKES(r.nhifShifDeduction)}
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums text-rose-600 font-medium">
                      {formatKES(r.payeTax)}
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums font-bold text-emerald-800 text-sm">
                      {formatKES(r.netPay)}
                    </td>

                    <td className="py-3 px-4 text-center font-sans">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                        {r.paymentStatus}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-sans">
                      <button
                        onClick={() => setSelectedPayslip(r)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
                      >
                        View Payslip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tab 2: Employees Directory */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => (
            <div key={emp.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{emp.name}</h4>
                  <p className="text-xs text-emerald-700 font-medium">{emp.position}</p>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                  {emp.status}
                </span>
              </div>

              <div className="text-xs text-slate-600 space-y-1 font-mono">
                <p>Phone: {emp.phone}</p>
                <p>KRA PIN: <span className="font-bold text-slate-800">{emp.kraPin}</span></p>
                <p>Dept: <span className="font-sans">{emp.department}</span></p>
                <p>Payment: <span className="font-sans uppercase text-slate-800 font-semibold">{emp.paymentMethod}</span></p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Gross Salary</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatKES(emp.basicSalary + emp.houseAllowance + emp.transportAllowance)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Run Payroll Generator */}
      {showRunPayrollModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="text-base font-bold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Compute & Run Staff Payroll
              </h3>
              <button onClick={() => setShowRunPayrollModal(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecutePayroll} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Employee *</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 font-medium"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.position}) - Basic: {formatKES(emp.basicSalary)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payroll Period / Month *</label>
                  <input
                    type="text"
                    value={runMonth}
                    onChange={(e) => setRunMonth(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Other Deductions / Advances (KES)</label>
                  <input
                    type="number"
                    min="0"
                    value={otherDeductions}
                    onChange={(e) => setOtherDeductions(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              {/* Dynamic preview calculation */}
              {(() => {
                const target = employees.find((e) => e.id === selectedEmpId);
                if (!target) return null;
                const calc = calculateKenyanPayroll(target, otherDeductions);

                return (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1.5">
                    <span className="font-bold text-emerald-950 uppercase tracking-wider text-[10px] block">
                      Statutory Calculation Preview (Kenya Rates):
                    </span>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Gross Salary (Basic + Allowances):</span>
                      <span className="font-mono font-bold text-slate-900">{formatKES(calc.grossSalary)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">NSSF Tier I & II:</span>
                      <span className="font-mono text-slate-800">- {formatKES(calc.nssfDeduction)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">SHIF / NHIF (2.75%):</span>
                      <span className="font-mono text-slate-800">- {formatKES(calc.nhifShifDeduction)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">PAYE Tax (after KES 2,400 Relief):</span>
                      <span className="font-mono text-rose-700 font-semibold">- {formatKES(calc.netPaye)}</span>
                    </div>
                    <div className="pt-1.5 border-t border-emerald-300 flex justify-between font-bold text-sm text-emerald-900">
                      <span>Net Salary to Disburse:</span>
                      <span className="font-mono tabular-nums">{formatKES(calc.netPay)}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRunPayrollModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                >
                  Confirm & Generate Payslip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Official Payslip Document Viewer & PDF Export */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto print:shadow-none print:border-none print:rounded-none">
            
            {/* Top Bar Actions */}
            <div className="no-print bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Staff Payslip · {selectedPayslip.month}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPayslipPDF}
                  disabled={isGeneratingPDF}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isGeneratingPDF ? 'Generating...' : 'Download PDF'}</span>
                </button>

                <button
                  onClick={handleSharePayslip}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share with Attached PDF</span>
                </button>

                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Payslip Body */}
            <div id="printable-payslip" className="p-6 sm:p-8 bg-white text-slate-800 text-xs font-sans space-y-6">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{company.name}</h3>
                  <p className="text-[11px] text-slate-500">{company.address}, {company.city} · KRA PIN: {company.kraPin}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold uppercase rounded text-[10px]">
                    OFFICIAL PAYSLIP
                  </span>
                  <div className="font-mono text-sm font-bold text-slate-900 mt-1">{selectedPayslip.month}</div>
                </div>
              </div>

              {/* Employee Particulars */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Employee Details</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedPayslip.employeeName}</div>
                  <div className="text-slate-600">{selectedPayslip.employeePosition}</div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Statutory IDs</span>
                  <div className="text-slate-800 font-semibold mt-0.5">KRA PIN: {selectedPayslip.employeeKraPin}</div>
                  <div className="text-slate-500">Pay Date: {formatDate(selectedPayslip.payDate)}</div>
                </div>
              </div>

              {/* Salary Breakdown Table */}
              <div className="space-y-4">
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 px-4 py-2 font-bold text-slate-700 flex justify-between">
                    <span>EARNINGS & ALLOWANCES</span>
                    <span>AMOUNT (KES)</span>
                  </div>
                  <div className="divide-y divide-slate-100 p-2 font-mono">
                    <div className="flex justify-between py-1 px-2">
                      <span className="font-sans">Basic Salary</span>
                      <span>{formatKES(selectedPayslip.basicSalary)}</span>
                    </div>
                    <div className="flex justify-between py-1 px-2">
                      <span className="font-sans">Allowances (House & Transport)</span>
                      <span>{formatKES(selectedPayslip.totalAllowances)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2 font-bold text-slate-900 bg-slate-50">
                      <span className="font-sans">GROSS SALARY</span>
                      <span>{formatKES(selectedPayslip.grossSalary)}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-rose-50 px-4 py-2 font-bold text-rose-800 flex justify-between">
                    <span>STATUTORY DEDUCTIONS</span>
                    <span>AMOUNT (KES)</span>
                  </div>
                  <div className="divide-y divide-slate-100 p-2 font-mono">
                    <div className="flex justify-between py-1 px-2">
                      <span className="font-sans">NSSF Contribution (Tier I & II)</span>
                      <span className="text-rose-700">- {formatKES(selectedPayslip.nssfDeduction)}</span>
                    </div>
                    <div className="flex justify-between py-1 px-2">
                      <span className="font-sans">SHIF / NHIF (2.75%)</span>
                      <span className="text-rose-700">- {formatKES(selectedPayslip.nhifShifDeduction)}</span>
                    </div>
                    <div className="flex justify-between py-1 px-2">
                      <span className="font-sans">PAYE Income Tax (Net of Relief)</span>
                      <span className="text-rose-700">- {formatKES(selectedPayslip.payeTax)}</span>
                    </div>
                    {selectedPayslip.otherDeductions > 0 && (
                      <div className="flex justify-between py-1 px-2">
                        <span className="font-sans">Other Deductions / Advance</span>
                        <span className="text-rose-700">- {formatKES(selectedPayslip.otherDeductions)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1.5 px-2 font-bold text-rose-900 bg-rose-50/50">
                      <span className="font-sans">TOTAL DEDUCTIONS</span>
                      <span>- {formatKES(selectedPayslip.totalDeductions)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Pay Box */}
              <div className="p-4 bg-emerald-800 text-white rounded-xl flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">NET PAYABLE</span>
                  <div className="text-lg font-bold">Dispatched via {selectedPayslip.paymentMethod.toUpperCase()}</div>
                  {selectedPayslip.mpesaRef && (
                    <div className="font-mono text-[10px] text-emerald-300">M-Pesa Ref: {selectedPayslip.mpesaRef}</div>
                  )}
                </div>
                <div className="font-mono text-2xl font-bold tabular-nums">
                  {formatKES(selectedPayslip.netPay)}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-200 text-center text-slate-400 text-[10px]">
                This is a computer-generated payslip issued by {company.name}.
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Employee } from '../types';

export interface KenyanPayrollCalculation {
  basicSalary: number;
  totalAllowances: number;
  grossSalary: number;
  nssfDeduction: number;
  nhifShifDeduction: number;
  taxablePay: number;
  grossPaye: number;
  personalRelief: number;
  insuranceRelief: number;
  netPaye: number;
  totalDeductions: number;
  netPay: number;
}

/**
 * Calculates Kenyan statutory payroll deductions (NSSF, SHIF/NHIF, PAYE, Reliefs)
 */
export function calculateKenyanPayroll(employee: Employee, otherDeductions: number = 0): KenyanPayrollCalculation {
  const basic = employee.basicSalary || 0;
  const allowances = (employee.houseAllowance || 0) + (employee.transportAllowance || 0) + (employee.otherAllowances || 0);
  const gross = basic + allowances;

  // 1. NSSF (Kenya New Rates - Tier 1 & 2 capped at 36,000 total)
  let nssf = 0;
  if (gross > 0) {
    const tier1Limit = 7000;
    const tier2Limit = 36000;

    const tier1 = Math.min(gross, tier1Limit) * 0.06;
    let tier2 = 0;
    if (gross > tier1Limit) {
      tier2 = Math.min(gross - tier1Limit, tier2Limit - tier1Limit) * 0.06;
    }
    nssf = Math.round((tier1 + tier2) * 100) / 100;
  }

  // 2. SHIF / NHIF (Social Health Insurance Fund - 2.75% of gross, min 300)
  let shif = 0;
  if (gross > 0) {
    shif = Math.max(300, Math.round(gross * 0.0275 * 100) / 100);
  }

  // 3. Taxable Pay (Gross minus allowable NSSF contribution)
  const taxablePay = Math.max(0, gross - nssf);

  // 4. PAYE Tax Bands (Kenya Monthly Graduated Bands)
  // Band 1: Up to 24,000 @ 10%
  // Band 2: 24,001 - 32,333 (8,333) @ 25%
  // Band 3: 32,334 - 500,000 (467,667) @ 30%
  // Band 4: 500,001 - 800,000 (300,000) @ 32.5%
  // Band 5: Above 800,000 @ 35%
  let tax = 0;
  let remaining = taxablePay;

  if (remaining > 0) {
    const band1 = Math.min(remaining, 24000);
    tax += band1 * 0.1;
    remaining -= band1;
  }
  if (remaining > 0) {
    const band2 = Math.min(remaining, 8333);
    tax += band2 * 0.25;
    remaining -= band2;
  }
  if (remaining > 0) {
    const band3 = Math.min(remaining, 467667);
    tax += band3 * 0.3;
    remaining -= band3;
  }
  if (remaining > 0) {
    const band4 = Math.min(remaining, 300000);
    tax += band4 * 0.325;
    remaining -= band4;
  }
  if (remaining > 0) {
    tax += remaining * 0.35;
  }

  const grossPaye = Math.round(tax * 100) / 100;

  // Reliefs
  const personalRelief = gross > 0 ? 2400 : 0; // KES 2,400 monthly personal relief
  const insuranceRelief = Math.round(shif * 0.15 * 100) / 100; // 15% of SHIF contribution
  const netPaye = Math.max(0, Math.round((grossPaye - personalRelief - insuranceRelief) * 100) / 100);

  // Total Deductions
  const totalDeductions = nssf + shif + netPaye + otherDeductions;
  const netPay = Math.max(0, Math.round((gross - totalDeductions) * 100) / 100);

  return {
    basicSalary: basic,
    totalAllowances: allowances,
    grossSalary: gross,
    nssfDeduction: nssf,
    nhifShifDeduction: shif,
    taxablePay,
    grossPaye,
    personalRelief,
    insuranceRelief,
    netPaye,
    totalDeductions,
    netPay,
  };
}

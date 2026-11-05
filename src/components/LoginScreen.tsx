/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Building2,
  Lock,
  Mail,
  Fingerprint,
  Shield,
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  Smartphone,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { CompanyProfile, TaxMode, User } from '../types';
import { authenticateBiometrics, generateTOTPCode } from '../utils/auth';

interface LoginScreenProps {
  companies: CompanyProfile[];
  users: User[];
  onLoginSuccess: (user: User) => void;
  onRegisterCompany: (
    companyData: Omit<CompanyProfile, 'id' | 'createdAt'>,
    adminData: { name: string; email: string; phone?: string; password?: string }
  ) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  companies,
  users,
  onLoginSuccess,
  onRegisterCompany,
}) => {
  // Default to register if no companies are present, otherwise allow toggling
  const [activeMode, setActiveMode] = useState<'register' | 'login'>(() =>
    companies.length === 0 ? 'register' : 'login'
  );

  // --- Registration Form State ---
  const [compName, setCompName] = useState('');
  const [tradingName, setTradingName] = useState('');
  const [kraPin, setKraPin] = useState('');
  const [compEmail, setCompEmail] = useState('');
  const [compPhone, setCompPhone] = useState('');
  const [compAddress, setCompAddress] = useState('');
  const [compCity, setCompCity] = useState('Nairobi');
  const [defaultTaxRate, setDefaultTaxRate] = useState<number>(16);
  const [defaultTaxMode, setDefaultTaxMode] = useState<TaxMode>('exclusive');
  const [mpesaTillNumber, setMpesaTillNumber] = useState('');
  const [mpesaPaybillNumber, setMpesaPaybillNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');

  // Admin Account Details
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // --- Sign In Form State ---
  const [loginEmail, setLoginEmail] = useState(users[0]?.email || '');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [totpSimulated, setTotpSimulated] = useState('');
  const [target2FAUser, setTarget2FAUser] = useState<User | null>(null);

  // Biometrics loading & Feedback
  const [isBioAuthenticating, setIsBioAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // --- Handlers ---
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!compName.trim()) {
      setErrorMessage('Please enter your legal company or business name.');
      return;
    }

    if (!kraPin.trim()) {
      setErrorMessage('Please enter your KRA PIN (e.g. P051234567Z).');
      return;
    }

    if (!adminName.trim() || !adminEmail.trim()) {
      setErrorMessage('Please fill in the administrator name and login email.');
      return;
    }

    if (adminPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (adminPassword !== adminConfirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    const companyData: Omit<CompanyProfile, 'id' | 'createdAt'> = {
      name: compName.trim(),
      tradingName: tradingName.trim() || compName.trim(),
      kraPin: kraPin.trim().toUpperCase(),
      phone: compPhone.trim() || '+254 700 000 000',
      email: compEmail.trim() || adminEmail.trim(),
      address: compAddress.trim() || 'Commercial Street',
      city: compCity.trim() || 'Nairobi',
      country: 'Kenya',
      currency: 'KES',
      defaultTaxRate: Number(defaultTaxRate) || 16,
      defaultTaxMode,
      mpesaTillNumber: mpesaTillNumber.trim() || undefined,
      mpesaPaybillNumber: mpesaPaybillNumber.trim() || undefined,
      bankName: bankName.trim() || undefined,
      bankAccountNumber: bankAccountNumber.trim() || undefined,
      invoicePrefix: `INV-${new Date().getFullYear()}-`,
      receiptPrefix: `RCT-${new Date().getFullYear()}-`,
      invoiceFooterNote: `Thank you for your business. Payment terms: Due upon receipt. Default currency: KES.`,
      subscriptionPlan: 'starter',
      subscriptionStatus: 'active',
      subscriptionExpiry: '2027-12-31T00:00:00Z',
      monthlyFee: 0,
    };

    const adminData = {
      name: adminName.trim(),
      email: adminEmail.trim().toLowerCase(),
      phone: adminPhone.trim() || compPhone.trim(),
      password: adminPassword,
    };

    onRegisterCompany(companyData, adminData);
  };

  const handleStandardLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (users.length === 0) {
      setErrorMessage('No company or users registered on this device yet. Please register your company first.');
      setActiveMode('register');
      return;
    }

    const user = users.find((u) => u.email.toLowerCase() === loginEmail.trim().toLowerCase());
    if (!user) {
      setErrorMessage('User with this email not found. Please verify or register your company.');
      return;
    }

    if (user.twoFactorEnabled) {
      setRequires2FA(true);
      setTarget2FAUser(user);
      setTotpSimulated(generateTOTPCode(user.twoFactorSecret || 'JBSWY3DPEHPK3PXP'));
      return;
    }

    onLoginSuccess(user);
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!target2FAUser) return;

    if (otpCode.trim().length === 6 || otpCode.trim() === totpSimulated) {
      onLoginSuccess(target2FAUser);
    } else {
      setErrorMessage('Invalid 6-digit verification code. Please check your Authenticator app.');
    }
  };

  const handleBiometricLogin = async () => {
    setErrorMessage('');
    if (users.length === 0) {
      setErrorMessage('No registered users found. Please register your company first.');
      return;
    }

    setIsBioAuthenticating(true);
    const target = users[0];
    const res = await authenticateBiometrics(target);
    setIsBioAuthenticating(false);

    if (res.success) {
      onLoginSuccess(target);
    } else {
      setErrorMessage(res.error || 'Biometric verification failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-3 sm:p-6 text-slate-100 relative">
      {/* Background radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950 via-slate-900 to-slate-950 pointer-events-none" />

      <div className="relative w-full max-w-xl bg-slate-800/90 backdrop-blur-xl border border-slate-700 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-6 my-auto">
        
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-emerald-600 text-white font-extrabold text-xl rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-900/40">
            BF
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white pt-1">
            BiasharaFlow ERP
          </h1>
          <p className="text-xs text-slate-400">
            Kenya Financial Accounting & Business Management Platform
          </p>
        </div>

        {/* Tab Switcher: Register Company vs Sign In */}
        <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-slate-700">
          <button
            type="button"
            onClick={() => {
              setActiveMode('register');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeMode === 'register'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Register New Company</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode('login');
              setErrorMessage('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeMode === 'login'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Sign In to Company</span>
          </button>
        </div>

        {/* Error / Success Banners */}
        {errorMessage && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* MODE 1: REGISTER NEW COMPANY */}
        {activeMode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            
            {/* Step 1: Company Profile */}
            <div className="space-y-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-700/80">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Building2 className="w-4 h-4" />
                <span>1. Business / Company Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Legal Business / Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kilima Agro & Hardware Enterprises Ltd"
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Trading / Branch Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Nairobi Head Office"
                    value={tradingName}
                    onChange={(e) => setTradingName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    KRA PIN (Mandatory for Invoices) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    placeholder="e.g. P051234567Z"
                    value={kraPin}
                    onChange={(e) => setKraPin(e.target.value.toUpperCase())}
                    className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Company Phone / Mobile *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +254 712 345 678"
                    value={compPhone}
                    onChange={(e) => setCompPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Company Official Email
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. info@company.co.ke"
                    value={compEmail}
                    onChange={(e) => setCompEmail(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    City / Town
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Nairobi, Mombasa, Kisumu"
                    value={compCity}
                    onChange={(e) => setCompCity(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Physical Address / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Industrial Area, Enterprise Road"
                    value={compAddress}
                    onChange={(e) => setCompAddress(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Default VAT Rate (%)
                  </label>
                  <select
                    value={defaultTaxRate}
                    onChange={(e) => setDefaultTaxRate(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={16}>16% (Standard Kenya VAT)</option>
                    <option value={8}>8% (Petroleum / Fuel VAT)</option>
                    <option value={0}>0% (Zero-Rated Exports)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    VAT Pricing Mode
                  </label>
                  <select
                    value={defaultTaxMode}
                    onChange={(e) => setDefaultTaxMode(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="exclusive">Exclusive (Add VAT on Top)</option>
                    <option value="inclusive">Inclusive (Prices include VAT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    M-Pesa Buy Goods Till (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 892341"
                    value={mpesaTillNumber}
                    onChange={(e) => setMpesaTillNumber(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    M-Pesa Paybill Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 247247"
                    value={mpesaPaybillNumber}
                    onChange={(e) => setMpesaPaybillNumber(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Administrator Account */}
            <div className="space-y-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-700/80">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Shield className="w-4 h-4" />
                <span>2. Managing Director / Administrator Account</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Admin Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. David Kamau"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Admin Login Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. david.kamau@company.co.ke"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Admin Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      required
                      placeholder="At least 6 characters"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full text-xs px-3 pr-9 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                    >
                      {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type={showRegisterPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter password"
                    value={adminConfirmPassword}
                    onChange={(e) => setAdminConfirmPassword(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Submit Registration */}
            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Register Company & Launch ERP Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* MODE 2: SIGN IN TO REGISTERED COMPANY */}
        {activeMode === 'login' && (
          <div className="space-y-4">
            {companies.length === 0 ? (
              <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-700 text-center space-y-3">
                <Building2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="text-sm font-bold text-white">No Registered Company Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  No business records exist on this browser. Register your company now to set up your KRA VAT configuration and admin account.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveMode('register')}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Register Your Company Now
                </button>
              </div>
            ) : requires2FA ? (
              <form onSubmit={handleVerify2FA} className="space-y-4">
                <div className="text-center space-y-1">
                  <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Two-Factor Authentication</h3>
                  <p className="text-xs text-slate-400">
                    Enter the 6-digit code from Google Authenticator
                  </p>
                </div>

                <div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    placeholder={`e.g. ${totpSimulated || '123456'}`}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full text-center tracking-widest font-mono text-lg py-2.5 px-4 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                  <p className="text-[10px] text-slate-400 text-center mt-1.5">
                    Current Authenticator Token: <span className="font-mono text-emerald-400 font-bold">{totpSimulated}</span>
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRequires2FA(false)}
                    className="w-1/2 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <span>Verify & Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleStandardLogin} className="space-y-4">
                {/* Active Company Badge */}
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">Registered Business</span>
                      <strong className="text-white">{companies[0]?.name}</strong>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {companies[0]?.kraPin}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Business Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="name@company.co.ke"
                      className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs pl-9 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Primary Sign In Button */}
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                >
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Biometric Passkey Login Button */}
                <button
                  type="button"
                  onClick={handleBiometricLogin}
                  disabled={isBioAuthenticating}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Fingerprint className="w-4 h-4 text-purple-400" />
                  <span>{isBioAuthenticating ? 'Scanning...' : 'Login with Biometrics / Face ID'}</span>
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

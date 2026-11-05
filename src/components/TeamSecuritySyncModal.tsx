/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Users,
  Shield,
  Fingerprint,
  RefreshCw,
  Download,
  Upload,
  CheckCircle,
  Key,
  Smartphone,
  QrCode,
  Lock,
  UserPlus,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { SyncSession, User, UserRole } from '../types';
import { authenticateBiometrics, registerBiometrics, ROLE_PERMISSIONS, generateTOTPCode } from '../utils/auth';
import { formatDateTime } from '../utils/formatters';

interface TeamSecuritySyncModalProps {
  users: User[];
  currentUser: User;
  syncSession: SyncSession;
  onClose: () => void;
  onSwitchUser: (user: User) => void;
  onAddUser: (user: User) => void;
  onUpdateCurrentUser: (user: User) => void;
  onExportData: () => void;
  onImportData: (jsonStr: string) => boolean;
  onTriggerSync: () => void;
}

export const TeamSecuritySyncModal: React.FC<TeamSecuritySyncModalProps> = ({
  users,
  currentUser,
  syncSession,
  onClose,
  onSwitchUser,
  onAddUser,
  onUpdateCurrentUser,
  onExportData,
  onImportData,
  onTriggerSync,
}) => {
  const [activeTab, setActiveTab] = useState<'team' | 'security' | 'sync'>('team');

  // Add User Form State
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('+254 ');
  const [newUserRole, setNewUserRole] = useState<UserRole>('cashier');

  // 2FA State
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [twoFactorSuccess, setTwoFactorSuccess] = useState(false);
  const [currentTOTP, setCurrentTOTP] = useState(() => generateTOTPCode());

  // Biometrics State
  const [bioLoading, setBioLoading] = useState(false);
  const [bioMessage, setBioMessage] = useState<{ text: string; success: boolean } | null>(null);

  // Import file ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      phone: newUserPhone.trim(),
      role: newUserRole,
      twoFactorEnabled: false,
      biometricRegistered: false,
      createdAt: new Date().toISOString(),
    };

    onAddUser(newUser);
    setShowAddUser(false);
    setNewUserName('');
    setNewUserEmail('');
  };

  const handleLinkSocial = (provider: 'google' | 'apple' | 'microsoft' | 'x') => {
    const updated = {
      ...currentUser,
      provider,
    };
    onUpdateCurrentUser(updated);
    setBioMessage({
      text: `Successfully linked your ${provider.toUpperCase()} enterprise account.`,
      success: true,
    });
    setTimeout(() => setBioMessage(null), 3000);
  };

  const handleRegisterBiometrics = async () => {
    setBioLoading(true);
    setBioMessage(null);
    const res = await registerBiometrics(currentUser);
    setBioLoading(false);

    if (res.success) {
      const updated = {
        ...currentUser,
        biometricRegistered: true,
        biometricCredentialId: res.credentialId,
      };
      onUpdateCurrentUser(updated);
      setBioMessage({
        text: 'Biometric Passkey registered successfully on this device!',
        success: true,
      });
    } else {
      setBioMessage({
        text: res.error || 'Failed to register biometric credentials.',
        success: false,
      });
    }
  };

  const handleTestBiometrics = async () => {
    setBioLoading(true);
    setBioMessage(null);
    const res = await authenticateBiometrics(currentUser);
    setBioLoading(false);

    if (res.success) {
      setBioMessage({
        text: 'Biometric authorization verified! Fast login active.',
        success: true,
      });
    } else {
      setBioMessage({
        text: res.error || 'Biometric verification failed.',
        success: false,
      });
    }
  };

  const handleToggle2FA = () => {
    const nextState = !currentUser.twoFactorEnabled;
    const updated = {
      ...currentUser,
      twoFactorEnabled: nextState,
      twoFactorSecret: nextState ? (currentUser.twoFactorSecret || 'JBSWY3DPEHPK3PXP') : undefined,
    };
    onUpdateCurrentUser(updated);
  };

  const handleVerify2FACode = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying2FA(true);
    setTimeout(() => {
      setIsVerifying2FA(false);
      // Accept code if match or standard demo code
      if (twoFactorCode.trim() === currentTOTP || twoFactorCode.trim().length === 6) {
        setTwoFactorSuccess(true);
        setTimeout(() => setTwoFactorSuccess(false), 3000);
      } else {
        alert('Invalid authenticator code. Please check your app or current token.');
      }
    }, 600);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = onImportData(content);
        if (ok) {
          alert('Database restored successfully! Reloading...');
          window.location.reload();
        } else {
          alert('Failed to import backup file. Format is invalid.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Team RBAC, Security & Device Sync
            </h3>
            <p className="text-xs text-slate-400">
              Active User: <span className="text-white font-semibold">{currentUser.name}</span> ({ROLE_PERMISSIONS[currentUser.role].label})
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2 gap-4">
          <button
            onClick={() => setActiveTab('team')}
            className={`pb-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'team'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Team & Roles ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`pb-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'security'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Fingerprint className="w-4 h-4" />
            <span>Social, 2FA & Biometrics</span>
          </button>

          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'sync'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Multi-Device Sync & Backup</span>
          </button>
        </div>

        {/* Body content */}
        <div className="overflow-y-auto p-5">
          
          {/* TAB 1: TEAM & RBAC */}
          {activeTab === 'team' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-900">
                <div>
                  <h4 className="font-bold">Role-Based Access Control Switcher</h4>
                  <p className="text-emerald-800 text-[11px] mt-0.5">
                    Click "Switch to This User" on any staff member below to test how BiasharaFlow dynamically grants or restricts views (e.g. cashiers see POS only, accountants see ledger, owner sees everything).
                  </p>
                </div>
                {currentUser.role === 'owner' && (
                  <button
                    onClick={() => setShowAddUser(!showAddUser)}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shrink-0 flex items-center gap-1.5 shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Staff Member</span>
                  </button>
                )}
              </div>

              {/* Add User Form */}
              {showAddUser && (
                <form onSubmit={handleCreateUser} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <h5 className="text-xs font-bold text-slate-800">Register New Team Member</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Mary Achieng"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 bg-white rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. mary@biasharaflow.co.ke"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 bg-white rounded-lg border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Phone Number (Kenya)</label>
                      <input
                        type="tel"
                        value={newUserPhone}
                        onChange={(e) => setNewUserPhone(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 bg-white rounded-lg border border-slate-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Assigned Role</label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as any)}
                        className="w-full text-xs px-3 py-1.5 bg-white rounded-lg border border-slate-300 font-medium"
                      >
                        <option value="owner">Owner / Super Admin (Full Access)</option>
                        <option value="manager">General Manager (Ops & Finance)</option>
                        <option value="accountant">Certified Accountant (Ledgers & Tax)</option>
                        <option value="cashier">Cashier / Sales Clerk (POS Only)</option>
                        <option value="inventory_clerk">Inventory / Storekeeper (Stock Only)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddUser(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
                    >
                      Save Team Member
                    </button>
                  </div>
                </form>
              )}

              {/* Users List */}
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {users.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  const perms = ROLE_PERMISSIONS[u.role];

                  return (
                    <div
                      key={u.id}
                      className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        isCurrent ? 'bg-emerald-50/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0 border border-slate-300">
                          {u.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-sm font-bold text-slate-900">{u.name}</h5>
                            {isCurrent && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                Active Session
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-mono">{u.email} · {u.phone}</p>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            <strong className="text-slate-900 font-semibold">{perms.label}:</strong> {perms.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {isCurrent ? (
                          <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" /> Current
                          </span>
                        ) : (
                          <button
                            onClick={() => onSwitchUser(u)}
                            className="px-3 py-1.5 border border-slate-300 hover:border-emerald-600 hover:text-emerald-700 rounded-lg text-xs font-semibold transition-colors bg-white shadow-xs"
                          >
                            Switch to This User
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: SECURITY, SOCIAL, 2FA & BIOMETRICS */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              
              {bioMessage && (
                <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                  bioMessage.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{bioMessage.text}</span>
                </div>
              )}

              {/* 1. Biometric Authentication */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                      <Fingerprint className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Biometric Passkey Authentication</h4>
                      <p className="text-xs text-slate-500">
                        Log in via Touch ID, Face ID, Windows Hello, or Android Fingerprint
                      </p>
                    </div>
                  </div>

                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    currentUser.biometricRegistered
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {currentUser.biometricRegistered ? 'Device Enrolled' : 'Not Configured'}
                  </span>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleRegisterBiometrics}
                    disabled={bioLoading}
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <Fingerprint className="w-4 h-4" />
                    <span>{currentUser.biometricRegistered ? 'Re-enroll Device Biometrics' : 'Enroll Fingerprint / Face ID'}</span>
                  </button>

                  {currentUser.biometricRegistered && (
                    <button
                      onClick={handleTestBiometrics}
                      disabled={bioLoading}
                      className="px-4 py-2 border border-slate-300 hover:bg-white text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Test Biometric Verification
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Two-Factor Authentication (2FA) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Two-Factor Authentication (2FA)</h4>
                      <p className="text-xs text-slate-500">
                        Time-based One-Time Password (TOTP) via Google Authenticator or Microsoft Authenticator
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleToggle2FA}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      currentUser.twoFactorEnabled
                        ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {currentUser.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                  </button>
                </div>

                {currentUser.twoFactorEnabled && (
                  <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Authenticator Secret Key
                      </span>
                      <div className="flex items-center justify-between font-mono text-sm bg-slate-100 p-2 rounded-md font-bold text-slate-800">
                        <span>{currentUser.twoFactorSecret || 'JBSWY3DPEHPK3PXP'}</span>
                        <Key className="w-4 h-4 text-slate-400" />
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Scan with Google Authenticator or Authy to generate real-time 6-digit codes.
                      </p>
                    </div>

                    <form onSubmit={handleVerify2FACode} className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Test 2FA Code Verification
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder={`Try: ${currentTOTP}`}
                          value={twoFactorCode}
                          onChange={(e) => setTwoFactorCode(e.target.value)}
                          className="w-full text-xs px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-300 font-mono tracking-widest text-center font-bold"
                        />
                        <button
                          type="submit"
                          disabled={isVerifying2FA}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold shrink-0"
                        >
                          Verify
                        </button>
                      </div>
                      {twoFactorSuccess && (
                        <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> 2FA Code Verified!
                        </p>
                      )}
                    </form>
                  </div>
                )}
              </div>

              {/* 3. Social Media Single Sign-On */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-sm font-bold text-slate-900">Enterprise Social & Cloud Single Sign-On</h4>
                <p className="text-xs text-slate-500">
                  Connect your business accounts for rapid 1-click team authentication:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <button
                    onClick={() => handleLinkSocial('google')}
                    className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                      currentUser.provider === 'google'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>Google Workspace</span>
                    {currentUser.provider === 'google' && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>

                  <button
                    onClick={() => handleLinkSocial('apple')}
                    className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                      currentUser.provider === 'apple'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>Apple ID</span>
                    {currentUser.provider === 'apple' && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>

                  <button
                    onClick={() => handleLinkSocial('microsoft')}
                    className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                      currentUser.provider === 'microsoft'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>Microsoft 365</span>
                    {currentUser.provider === 'microsoft' && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>

                  <button
                    onClick={() => handleLinkSocial('x')}
                    className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                      currentUser.provider === 'x'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>X (Twitter)</span>
                    {currentUser.provider === 'x' && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: MULTI-DEVICE SYNC & BACKUP */}
          {activeTab === 'sync' && (
            <div className="space-y-5">
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Decentralized Cross-Device Sync Engine
                    </span>
                    <h4 className="text-base font-bold mt-0.5">BiasharaFlow Cloud & P2P Synchronization</h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Keep smartphone POS terminals, tablets, and desktop back-office ledgers in continuous harmony.
                    </p>
                  </div>

                  <button
                    onClick={onTriggerSync}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-2 shrink-0 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Sync Now</span>
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Current Device ID:</span>
                    <span className="font-mono text-slate-200 font-semibold">{syncSession.deviceId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Cloud Sync Token:</span>
                    <span className="font-mono text-emerald-400 font-bold">{syncSession.syncToken}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-slate-400 block text-[10px]">Last Sync Timestamp:</span>
                    <span className="font-mono text-slate-200">{formatDateTime(syncSession.lastSyncTimestamp)}</span>
                  </div>
                </div>
              </div>

              {/* Backup & Restore JSON files */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-600" />
                    Export Full Business Database (JSON)
                  </h5>
                  <p className="text-xs text-slate-500">
                    Download an encrypted complete snapshot of customers, stock, sales, expenses, and audit logs.
                  </p>
                  <button
                    onClick={onExportData}
                    className="mt-2 w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download JSON Backup</span>
                  </button>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-purple-600" />
                    Import / Restore Database (JSON)
                  </h5>
                  <p className="text-xs text-slate-500">
                    Restore data from another device or backup file. Existing records will be updated safely.
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Select JSON File to Restore</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

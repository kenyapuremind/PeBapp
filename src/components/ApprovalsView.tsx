/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  DollarSign,
  AlertCircle,
  UserCheck,
  Plus,
  X,
} from 'lucide-react';
import { ApprovalRequest, ApprovalStatus, CompanyProfile, User } from '../types';
import { formatDate, formatDateTime, formatKES } from '../utils/formatters';
import { ROLE_PERMISSIONS } from '../utils/auth';

interface ApprovalsViewProps {
  approvals: ApprovalRequest[];
  company: CompanyProfile;
  currentUser: User;
  onUpdateApproval: (updated: ApprovalRequest) => void;
  onCreateApproval: (newReq: ApprovalRequest) => void;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  approvals,
  company,
  currentUser,
  onUpdateApproval,
  onCreateApproval,
}) => {
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [showNewModal, setShowNewModal] = useState(false);
  const [reviewModalRequest, setReviewModalRequest] = useState<ApprovalRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // New Request Form
  const [reqTitle, setReqTitle] = useState('');
  const [reqType, setReqType] = useState<ApprovalRequest['type']>('expense');
  const [reqAmount, setReqAmount] = useState<number>(15000);

  const isAuthorizer = currentUser.role === 'owner' || currentUser.role === 'manager';

  const filteredApprovals = approvals.filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  const handleDecision = (status: 'approved' | 'rejected') => {
    if (!reviewModalRequest) return;
    const updated: ApprovalRequest = {
      ...reviewModalRequest,
      status,
      reviewedByUserId: currentUser.id,
      reviewedByName: `${currentUser.name} (${ROLE_PERMISSIONS[currentUser.role].label})`,
      reviewDate: new Date().toISOString(),
      reviewNotes: reviewNotes.trim() || undefined,
    };
    onUpdateApproval(updated);
    setReviewModalRequest(null);
    setReviewNotes('');
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle.trim()) return;

    const newReq: ApprovalRequest = {
      id: `appr-${Date.now()}`,
      companyId: company.id,
      type: reqType,
      targetId: `req-${Date.now().toString().slice(-4)}`,
      title: reqTitle.trim(),
      amount: reqAmount,
      requestedByUserId: currentUser.id,
      requestedByName: `${currentUser.name} (${ROLE_PERMISSIONS[currentUser.role].label})`,
      requestDate: new Date().toISOString(),
      status: 'pending',
    };

    onCreateApproval(newReq);
    setShowNewModal(false);
    setReqTitle('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            Governance & Financial Controls
          </span>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Internal Approvals & Authorization Queue
          </h2>
          <p className="text-xs text-slate-500">
            Multi-tier workflow for high-value expenses, credit sales, discounts, and payroll disbursements
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Submit Request for Approval</span>
        </button>
      </div>

      {/* Filter Segmented Controls */}
      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs w-fit">
        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
            statusFilter === 'pending' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>Pending ({approvals.filter((a) => a.status === 'pending').length})</span>
        </button>

        <button
          onClick={() => setStatusFilter('approved')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
            statusFilter === 'approved' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>Approved ({approvals.filter((a) => a.status === 'approved').length})</span>
        </button>

        <button
          onClick={() => setStatusFilter('rejected')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
            statusFilter === 'rejected' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
          }`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>Rejected ({approvals.filter((a) => a.status === 'rejected').length})</span>
        </button>

        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors ${
            statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
          }`}
        >
          All
        </button>
      </div>

      {/* Requests List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredApprovals.length === 0 ? (
          <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 italic">
            No approval requests found in this category.
          </div>
        ) : (
          filteredApprovals.map((req) => (
            <div
              key={req.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {req.type.replace('_', ' ')}
                  </span>

                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    req.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : req.status === 'rejected'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {req.status === 'pending' && <Clock className="w-3 h-3" />}
                    {req.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                    {req.status === 'rejected' && <XCircle className="w-3 h-3" />}
                    <span>{req.status}</span>
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 mt-2">{req.title}</h4>
                <div className="font-mono text-lg font-bold text-emerald-800 mt-1">
                  {formatKES(req.amount)}
                </div>

                <div className="mt-3 text-xs text-slate-500 space-y-0.5">
                  <p>Requested by: <strong className="text-slate-800">{req.requestedByName}</strong></p>
                  <p>Date: {formatDateTime(req.requestDate)}</p>
                </div>

                {req.reviewedByName && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <p className="font-semibold text-slate-800">
                      Reviewed by {req.reviewedByName} on {formatDateTime(req.reviewDate || '')}
                    </p>
                    {req.reviewNotes && (
                      <p className="text-slate-600 italic mt-0.5">"{req.reviewNotes}"</p>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons if pending and authorizer */}
              {req.status === 'pending' && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  {isAuthorizer ? (
                    <button
                      onClick={() => setReviewModalRequest(req)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Review Decision</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Pending manager authorization</span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Decision Modal */}
      {reviewModalRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Authorize or Reject Requisition</h3>
              <button onClick={() => setReviewModalRequest(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div className="font-bold text-slate-900 text-sm">{reviewModalRequest.title}</div>
              <div className="font-mono text-emerald-800 font-bold mt-1 text-base">{formatKES(reviewModalRequest.amount)}</div>
              <div className="text-slate-500 mt-1">Submitted by: {reviewModalRequest.requestedByName}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reviewer Note / Justification</label>
              <textarea
                rows={3}
                placeholder="e.g. Approved per annual procurement budget"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 rounded-xl border border-slate-300"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleDecision('rejected')}
                className="w-1/2 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs border border-rose-200 flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>
              <button
                onClick={() => handleDecision('approved')}
                className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Authorize</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Submit Financial Requisition</h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Requisition Type</label>
                <select
                  value={reqType}
                  onChange={(e) => setReqType(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 font-medium"
                >
                  <option value="expense">Operating Expense Purchase</option>
                  <option value="credit_sale">High-Value Credit Sale</option>
                  <option value="discount">Special Customer Trade Discount</option>
                  <option value="payroll">Advance / Bonus Payroll</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title & Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Warehouse Security Camera Upgrade"
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (KES) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={reqAmount}
                  onChange={(e) => setReqAmount(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 font-mono font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-xs border border-slate-300 rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                >
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

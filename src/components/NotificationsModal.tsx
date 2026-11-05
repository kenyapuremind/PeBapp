/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Bell,
  X,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle,
  Package,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { AppNotification } from '../types';
import { formatDateTime } from '../utils/formatters';

interface NotificationsModalProps {
  notifications: AppNotification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNavigateToTab: (tab: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  notifications,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigateToTab,
}) => {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleItemClick = (n: AppNotification) => {
    onMarkAsRead(n.id);
    if (n.linkTab) {
      onNavigateToTab(n.linkTab);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold">Business Alert Center</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                {unreadCount} New
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action strip */}
        {unreadCount > 0 && (
          <div className="bg-slate-50 px-5 py-2.5 border-b border-slate-200 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">System and Financial Notifications</span>
            <button
              onClick={onMarkAllAsRead}
              className="text-emerald-700 font-bold hover:underline"
            >
              Mark all as read
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="overflow-y-auto divide-y divide-slate-100 p-2">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs italic">
              No notifications at this time.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={`p-3.5 rounded-xl transition-colors cursor-pointer flex items-start gap-3 ${
                  n.isRead ? 'hover:bg-slate-50' : 'bg-emerald-50/50 hover:bg-emerald-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  n.type === 'low_stock'
                    ? 'bg-amber-100 text-amber-700'
                    : n.type === 'approval_required'
                    ? 'bg-purple-100 text-purple-700'
                    : n.type === 'overdue_invoice'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {n.type === 'low_stock' && <Package className="w-4 h-4" />}
                  {n.type === 'approval_required' && <ShieldCheck className="w-4 h-4" />}
                  {n.type === 'overdue_invoice' && <Clock className="w-4 h-4" />}
                  {n.type === 'payroll_due' && <DollarSign className="w-4 h-4" />}
                  {n.type === 'system' && <Bell className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{n.title}</h4>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {formatDateTime(n.createdAt)}
                  </span>
                </div>

                {n.linkTab && (
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 self-center" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

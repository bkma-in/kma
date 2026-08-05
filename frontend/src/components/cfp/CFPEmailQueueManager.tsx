import React, { useState, useEffect } from 'react';
import { Mail, Clock, RefreshCw, XCircle, CheckCircle2, AlertTriangle, Play, Loader2 } from 'lucide-react';
import type { QueueStats } from '../../types/cfp';
import { getQueueStats, retryFailedQueue, cancelPendingQueue } from '../../services/cfp.service';
import { useNotification } from '../../utils/NotificationContext';

interface CFPEmailQueueManagerProps {
  cfpId?: string;
}

export const CFPEmailQueueManager: React.FC<CFPEmailQueueManagerProps> = ({ cfpId }) => {
  const { showToast, confirm } = useNotification();
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await getQueueStats(cfpId);
      if (res.success) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to fetch queue stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const timer = setInterval(fetchStats, 15000); // refresh every 15s
    return () => clearInterval(timer);
  }, [cfpId]);

  const handleRetryFailed = () => {
    confirm({
      title: 'Retry Failed Emails',
      message: 'This will reset failed email recipients back to pending so they can be dispatched in the next batch.',
      confirmText: 'Retry Failed',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const res = await retryFailedQueue(cfpId);
          if (res.success) {
            showToast(res.message || 'Reset failed emails to pending.', 'success');
            await fetchStats();
          }
        } catch (err: any) {
          showToast(err.response?.data?.error || 'Failed to retry queue', 'error');
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const handleCancelPending = () => {
    confirm({
      title: 'Cancel Pending Emails',
      message: 'Are you sure you want to cancel all pending queued emails for this campaign?',
      confirmText: 'Cancel Pending',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const res = await cancelPendingQueue(cfpId);
          if (res.success) {
            showToast(res.message || 'Cancelled pending emails.', 'info');
            await fetchStats();
          }
        } catch (err: any) {
          showToast(err.response?.data?.error || 'Failed to cancel queue', 'error');
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 space-y-4 animate-pulse">
        <div className="h-6 bg-zinc-100 rounded-lg w-1/4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-20 bg-zinc-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold">
            <Mail size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-black font-['Outfit']">Email Delivery Campaign Queue</h3>
            <p className="text-xs text-zinc-500 font-medium">Daily Limit: 100 emails/day (Render Cron Job)</p>
          </div>
        </div>

        <button
          onClick={fetchStats}
          disabled={actionLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-600 hover:text-black hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <RefreshCw size={14} className={actionLoading ? 'animate-spin' : ''} />
          <span>Refresh Progress</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 space-y-1">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Total Recipients</p>
          <p className="text-2xl font-black text-black font-['Outfit']">{stats.totalRecipients}</p>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4 space-y-1">
          <p className="text-xs text-emerald-700 font-medium uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 size={14} /> Sent
          </p>
          <p className="text-2xl font-black text-emerald-900 font-['Outfit']">{stats.sentCount}</p>
        </div>

        <div className="bg-blue-50/50 border border-blue-200/80 rounded-2xl p-4 space-y-1">
          <p className="text-xs text-blue-700 font-medium uppercase tracking-wider flex items-center gap-1">
            <Clock size={14} /> Pending
          </p>
          <p className="text-2xl font-black text-blue-900 font-['Outfit']">{stats.pendingCount}</p>
        </div>

        <div className="bg-rose-50/50 border border-rose-200/80 rounded-2xl p-4 space-y-1">
          <p className="text-xs text-rose-700 font-medium uppercase tracking-wider flex items-center gap-1">
            <XCircle size={14} /> Failed
          </p>
          <p className="text-2xl font-black text-rose-900 font-['Outfit']">{stats.failedCount}</p>
        </div>
      </div>

      {/* Quota & Progress Bar */}
      <div className="space-y-3 bg-zinc-50 p-4 sm:p-5 rounded-2xl border border-zinc-200">
        <div className="flex flex-wrap items-center justify-between text-xs font-bold gap-2">
          <span className="text-zinc-600 uppercase tracking-wider">
            Daily Quota Used: <span className="text-black font-mono text-sm">{stats.quotaUsedFormatted}</span>
          </span>
          <span className="text-black">{stats.progressPercentage}% Completed</span>
        </div>

        <div className="w-full h-3 bg-zinc-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-black rounded-full transition-all duration-500"
            style={{ width: `${stats.progressPercentage}%` }}
          />
        </div>

        {stats.estimatedCompletionDate && (
          <p className="text-xs text-zinc-500 font-medium pt-1">
            ⏱️ Estimated Completion Date: <strong className="text-black">{stats.estimatedCompletionDate}</strong>
          </p>
        )}
      </div>

      {/* Admin Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        {stats.failedCount > 0 && (
          <button
            onClick={handleRetryFailed}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Retry Failed ({stats.failedCount})</span>
          </button>
        )}

        {stats.pendingCount > 0 && (
          <button
            onClick={handleCancelPending}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <XCircle size={14} />
            <span>Cancel Pending ({stats.pendingCount})</span>
          </button>
        )}
      </div>
    </div>
  );
};

import { useState } from 'react';
import {
  Bell,
  Bug,
  Check,
  AlertCircle,
  Clock,
  CheckCircle2,
  Trash2,
  Inbox,
  ChevronRight,
  Terminal,
  Zap,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../utils/NotificationContext';

interface DevNotification {
  id: string;
  type: 'new_issue' | 'resolved' | 'in_progress' | 'system' | 'alert';
  title: string;
  subject: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const DeveloperNotifications = () => {
  const { confirm, showToast } = useNotification();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [notifications, setNotifications] = useState<DevNotification[]>([
    {
      id: '1',
      type: 'new_issue',
      title: 'New Issue Reported',
      subject: 'UI Bug — Article submission form crashes on Safari',
      message: 'A new frontend bug has been submitted by an Author. Priority: High. Please assess and triage the report.',
      timestamp: '12 min ago',
      read: false,
    },
    {
      id: '2',
      type: 'alert',
      title: 'Multiple Reports Detected',
      subject: 'Notification bell badge not clearing on mobile',
      message: 'This issue has been reported by 3 different users across different roles. Escalation recommended.',
      timestamp: '1 hour ago',
      read: false,
    },
    {
      id: '3',
      type: 'in_progress',
      title: 'Issue Status Updated',
      subject: 'PDF viewer not rendering on Reviewer portal',
      message: 'Issue #IRQ-012 has been moved to In Progress by your team. ETA for resolution: 2 hours.',
      timestamp: '3 hours ago',
      read: false,
    },
    {
      id: '4',
      type: 'resolved',
      title: 'Issue Resolved',
      subject: 'Sidebar collapse animation broken on tablet',
      message: 'Issue #IRQ-008 has been successfully resolved and deployed. Closing from the active queue.',
      timestamp: 'Yesterday',
      read: true,
    },
    {
      id: '5',
      type: 'system',
      title: 'System Maintenance Window',
      subject: 'KMA Platform — Scheduled Downtime',
      message: 'A maintenance window is scheduled for Saturday 02:00–04:00 IST. Backend services will be temporarily unavailable.',
      timestamp: '2 days ago',
      read: true,
    },
  ]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast('All notifications marked as read', 'success');
  };

  const clearAll = () => {
    confirm({
      title: 'Clear Notifications',
      message: 'Are you sure you want to permanently clear all developer notifications?',
      confirmText: 'Clear All',
      onConfirm: () => {
        setNotifications([]);
        showToast('Notification archive cleared', 'info');
      },
    });
  };

  const getIcon = (type: DevNotification['type'], read: boolean) => {
    const size = 20;
    const base = cn(
      'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-all',
      read ? 'bg-zinc-100 text-zinc-400' : ''
    );
    switch (type) {
      case 'new_issue':
        return <div className={cn(base, !read && 'bg-blue-50 text-blue-600 shadow-blue-500/10')}><Bug size={size} /></div>;
      case 'alert':
        return <div className={cn(base, !read && 'bg-rose-50 text-rose-600 shadow-rose-500/10')}><ShieldAlert size={size} /></div>;
      case 'in_progress':
        return <div className={cn(base, !read && 'bg-amber-50 text-amber-600 shadow-amber-500/10')}><Clock size={size} /></div>;
      case 'resolved':
        return <div className={cn(base, !read && 'bg-emerald-50 text-emerald-600 shadow-emerald-500/10')}><CheckCircle2 size={size} /></div>;
      case 'system':
        return <div className={cn(base, !read && 'bg-zinc-800 text-white shadow-black/10')}><Terminal size={size} /></div>;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'UNREAD') return !n.read;
    if (activeTab === 'READ') return n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="animate-in fade-in duration-700 max-w-5xl mx-auto px-4">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white shadow-lg shadow-black/10">
              <Bell size={18} />
            </div>
            <h2 className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase font-['Outfit']">
              Dev Alert Center
            </h2>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-black font-['Outfit']">
            Notifications
          </h1>
          <p className="text-zinc-500 mt-2 text-sm leading-relaxed max-w-md">
            Stay on top of incoming bug reports, escalation alerts, status changes, and system events.
          </p>
        </div>

        <div className="flex items-center gap-6">
          {notifications.length > 0 && (
            <>
              <button
                onClick={markAllAsRead}
                className="text-[10px] font-black text-zinc-400 hover:text-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all group"
              >
                <Check size={14} className="group-hover:scale-110 transition-transform" />
                MARK ALL AS READ
              </button>
              <button
                onClick={clearAll}
                className="text-[10px] font-black text-rose-400/80 hover:text-rose-600 uppercase tracking-[0.2em] flex items-center gap-2 transition-all group"
              >
                <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
                CLEAR ARCHIVE
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Filter */}
      <div className="flex items-center gap-1 bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200 shadow-inner w-fit mb-8">
        {(['ALL', 'UNREAD', 'READ'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all flex items-center gap-2',
              activeTab === tab
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-zinc-600'
            )}
          >
            {tab}
            {tab === 'UNREAD' && unreadCount > 0 && (
              <span className="bg-black text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {filteredNotifications.length > 0 ? (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                'group relative bg-white rounded-[2rem] border p-6 flex gap-6 transition-all duration-500',
                !notification.read
                  ? 'border-black/5 shadow-2xl shadow-black/[0.03] ring-1 ring-black/[0.02]'
                  : 'border-zinc-100 opacity-60 hover:opacity-100 hover:shadow-xl hover:shadow-black/[0.02]'
              )}
            >
              {/* Icon */}
              {getIcon(notification.type, notification.read)}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <h3
                    className={cn(
                      'text-[10px] font-black tracking-widest uppercase',
                      !notification.read ? 'text-black' : 'text-zinc-500'
                    )}
                  >
                    {notification.title}
                  </h3>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest shrink-0 ml-4">
                    {notification.timestamp}
                  </span>
                </div>

                <p
                  className={cn(
                    'text-sm font-semibold mb-1',
                    !notification.read ? 'text-zinc-800' : 'text-zinc-500'
                  )}
                >
                  {notification.subject}
                </p>

                <p
                  className={cn(
                    'text-sm leading-relaxed mb-4',
                    !notification.read ? 'text-zinc-500' : 'text-zinc-400'
                  )}
                >
                  {notification.message}
                </p>

                <button
                  onClick={() => {
                    markAsRead(notification.id);
                    navigate('/dev/issues');
                  }}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all shadow-sm',
                    !notification.read
                      ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                      : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                  )}
                >
                  <Zap size={12} />
                  {notification.type === 'system' ? 'VIEW SYSTEM LOG' : 'VIEW ISSUES'}
                </button>
              </div>

              {/* Unread dot + Mark Read action */}
              <div className="flex flex-col items-end justify-between py-1">
                {!notification.read ? (
                  <div className="w-2.5 h-2.5 bg-black rounded-full animate-pulse shadow-lg shadow-black/20" />
                ) : (
                  <div className="w-2.5 h-2.5 bg-transparent" />
                )}

                {!notification.read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                    className="p-2.5 hover:bg-zinc-50 rounded-2xl text-zinc-200 hover:text-black transition-all border border-transparent hover:border-zinc-100 shadow-sm"
                    title="Mark as read"
                    aria-label="Mark notification as read"
                  >
                    <Check size={18} />
                  </button>
                )}
              </div>

              {/* Hover arrow */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-500">
                <ChevronRight size={24} className="text-zinc-100" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] p-32 border border-zinc-100 shadow-sm text-center flex flex-col items-center animate-in fade-in zoom-in duration-700">
          <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mb-10 border-4 border-white shadow-inner">
            <Inbox size={48} className="text-zinc-200" />
          </div>
          <h3 className="text-3xl font-bold text-black mb-3 tracking-tighter font-['Outfit']">
            All Clear
          </h3>
          <p className="text-zinc-500 text-sm max-w-sm mb-12 leading-relaxed italic">
            "No {activeTab === 'ALL' ? '' : activeTab.toLowerCase() + ' '}notifications found. The dev queue is silent."
          </p>
          <button
            onClick={() => navigate('/dev/dashboard')}
            className="flex items-center gap-3 px-10 py-4 bg-black text-white rounded-2xl text-xs font-bold tracking-widest hover:bg-zinc-800 transition-all shadow-2xl shadow-black/10 active:scale-95"
          >
            RETURN TO CONSOLE
          </button>
        </div>
      )}
    </div>
  );
};

export default DeveloperNotifications;

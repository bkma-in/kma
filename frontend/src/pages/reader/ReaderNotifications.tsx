import React from 'react';
import { useState } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Trash2,
  Clock,
  Info,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNotification } from '../../utils/NotificationContext';

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  type: 'success' | 'warning' | 'info' | 'error';
  read: boolean;
}

const ReaderNotifications = () => {
  const { showToast } = useNotification();
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, title: 'Payment Successful', message: 'Your payment for "Quantum Computing" has been processed.', time: '2 hours ago', type: 'success', read: false },
    { id: 2, title: 'New Article Published', message: 'A new article in Topology is now available.', time: '5 hours ago', type: 'info', read: true },
    { id: 3, title: 'Renewal Reminder', message: 'Your annual membership expires in 15 days.', time: '1 day ago', type: 'warning', read: false },
    { id: 4, title: 'Access Granted', message: 'You now have full access to the "Advanced Cryptography" manuscript.', time: '2 days ago', type: 'success', read: true },
    { id: 5, title: 'Payment Failed', message: 'Your last transaction for "Fluid Dynamics" was unsuccessful.', time: '3 days ago', type: 'error', read: true },
  ]);

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    showToast('Notification marked as read', 'info');
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast('All notifications marked as read', 'success');
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    showToast('Notification deleted', 'info');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={18} className="text-emerald-600" />;
      case 'warning': return <AlertCircle size={18} className="text-amber-600" />;
      case 'error': return <Trash2 size={18} className="text-rose-600" />;
      default: return <Info size={18} className="text-blue-600" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-black tracking-tight font-['Outfit']">Notifications</h1>
          <p className="text-zinc-500 mt-1">Stay updated with your account activity and new publications.</p>
        </div>
        <button 
          onClick={markAllAsRead}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-black text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-all border border-zinc-200 shadow-sm"
        >
          <CheckCheck size={16} /> Mark all as read
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.map((notif) => (
          <div key={notif.id} className={cn(
            "bg-white border border-zinc-200 p-6 rounded-2xl flex flex-col sm:flex-row items-start gap-5 transition-all group relative overflow-hidden shadow-sm",
            !notif.read && "border-black bg-zinc-50/50 shadow-md"
          )}>
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
              notif.type === 'success' ? 'bg-emerald-50' :
              notif.type === 'warning' ? 'bg-amber-50' :
              notif.type === 'error' ? 'bg-rose-50' : 'bg-blue-50'
            )}>
              {getIcon(notif.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className={cn("text-sm font-bold", notif.read ? "text-zinc-500" : "text-black")}>
                  {notif.title}
                </h3>
                {!notif.read && (
                  <span className="w-1.5 h-1.5 rounded-full bg-black shadow-[0_0_8px_rgba(0,0,0,0.2)]" />
                )}
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-2xl">{notif.message}</p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                  <Clock size={12} /> {notif.time}
                </div>
                {!notif.read && (
                  <button 
                    onClick={() => markAsRead(notif.id)}
                    className="text-[10px] text-black hover:underline font-black uppercase tracking-widest"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button 
                onClick={() => deleteNotification(notif.id)}
                className="p-3 bg-zinc-50 text-zinc-400 hover:text-rose-600 rounded-xl transition-all opacity-0 group-hover:opacity-100 border border-zinc-100 shadow-sm"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="py-20 text-center bg-white rounded-3xl border border-zinc-200 border-dashed">
            <div className="flex flex-col items-center gap-4 opacity-10">
              <Bell size={48} className="text-black" />
              <p className="text-xs font-bold uppercase tracking-widest text-black">No notifications to show</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReaderNotifications;

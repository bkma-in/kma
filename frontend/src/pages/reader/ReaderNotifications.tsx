import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Trash2,
  Clock,
  Info,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNotification } from '../../utils/NotificationContext';
import api from '../../services/api';
import { db, auth } from '../../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'success' | 'warning' | 'info' | 'error';
  read: boolean;
}

const ReaderNotifications = () => {
  const { showToast } = useNotification();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let notifs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || 'Notification',
          message: data.message || '',
          time: formatTime(data.createdAt),
          type: getNotificationType(data.type),
          read: data.read || false
        };
      }) as Notification[];
      
      // Sort in memory to avoid needing a composite index in Firestore
      notifs.sort((a, b) => {
        const docA = snapshot.docs.find(d => d.id === a.id);
        const docB = snapshot.docs.find(d => d.id === b.id);
        const timeA = docA?.data().createdAt?._seconds || 0;
        const timeB = docB?.data().createdAt?._seconds || 0;
        return timeB - timeA;
      });

      setNotifications(notifs);
      setLoading(false);

      // Auto mark as read when on this page
      const unreadIds = notifs.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length > 0) {
        unreadIds.forEach(id => {
          api.patch(`/notifications/${id}/read`).catch(console.error);
        });
      }
    }, (error) => {
      console.error('Real-time reader notifications error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatTime = (createdAt: any) => {
    if (!createdAt) return 'RECENTLY';
    const seconds = createdAt._seconds || (typeof createdAt === 'number' ? createdAt / 1000 : null);
    if (!seconds) return 'RECENTLY';
    
    const date = new Date(seconds * 1000);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'JUST NOW';
    if (diffInHours < 24) return `${diffInHours}H AGO`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  };

  const getNotificationType = (backendType: string): Notification['type'] => {
    switch (backendType) {
      case 'PAYMENT_SUCCESS':
      case 'SUBSCRIPTION_ACTIVE':
        return 'success';
      case 'PAYMENT_FAILED':
        return 'error';
      case 'SUBSCRIPTION_EXPIRING':
        return 'warning';
      default:
        return 'info';
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      showToast('Notification marked as read', 'info');
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      if (unread.length === 0) return;
      await Promise.all(unread.map(n => api.patch(`/notifications/${n.id}/read`)));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      showToast('All notifications marked as read', 'success');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      showToast('Notification deleted', 'info');
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={18} className="text-emerald-600" />;
      case 'warning': return <AlertCircle size={18} className="text-amber-600" />;
      case 'error': return <XCircle size={18} className="text-rose-600" />;
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
        {notifications.length > 0 && (
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-black text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-all border border-zinc-200 shadow-sm"
          >
            <CheckCheck size={16} /> Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={36} className="animate-spin text-zinc-300" />
          <p className="text-sm font-semibold text-zinc-400">Loading alerts...</p>
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default ReaderNotifications;

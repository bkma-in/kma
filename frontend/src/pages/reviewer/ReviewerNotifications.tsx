import { useState, useEffect } from 'react';
import { 
  Bell, 
  BookOpen, 
  Check, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  Inbox,
  ChevronRight,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../utils/NotificationContext';
import { db, auth } from '../../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import api from '../../services/api';

interface Notification {
  id: string;
  type: 'assignment' | 'reminder' | 'submitted' | 'alert';
  title: string;
  articleTitle?: string;
  articleId?: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const ReviewerNotifications = () => {
  const { confirm, showToast } = useNotification();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const getTimestamp = (val: any) => {
    if (!val) return 0;
    if (val._seconds) return val._seconds * 1000;
    if (typeof val.toMillis === 'function') return val.toMillis();
    return new Date(val).getTime() || 0;
  };

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

  const getNotificationDisplayType = (backendType: string): Notification['type'] => {
    switch (backendType) {
      case 'INVITATION_SENT':
      case 'INVITATION_ACCEPTED':
      case 'INVITATION_REJECTED':
      case 'ARTICLE_ASSIGNED':
      case 'WELCOME_REVIEWER':
        return 'assignment';
      case 'REVIEW_REMINDER':
        return 'reminder';
      case 'REVIEW_SUBMITTED':
        return 'submitted';
      default:
        return 'alert';
    }
  };

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
          timestamp: formatTime(data.createdAt),
          read: !!data.read,
          type: getNotificationDisplayType(data.type),
          articleTitle: data.metadata?.articleTitle || data.articleTitle || '',
          articleId: data.metadata?.articleId || data.articleId || '',
          createdAt: data.createdAt // Kept for sorting
        };
      }) as any[];
      
      // Sort in memory by newest first (createdAt desc)
      notifs.sort((a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt));

      setNotifications(notifs);
      setLoading(false);

      // Auto mark as read on opening page using read-all batch API
      const unreadCount = notifs.filter(n => !n.read).length;
      if (unreadCount > 0) {
        api.post('/notifications/read-all').catch(console.error);
      }
    }, (error) => {
      console.error('Real-time reviewer notifications error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      showToast('All notifications marked as read', 'success');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const clearAll = () => {
    confirm({
      title: 'Clear Notifications',
      message: 'Are you sure you want to permanently clear your alert archive?',
      confirmText: 'Clear Archive',
      onConfirm: async () => {
        try {
          await api.delete('/notifications');
          setNotifications([]);
          showToast('Notification archive cleared', 'info');
        } catch (error) {
          console.error('Failed to clear notifications:', error);
          showToast('Failed to clear notifications.', 'error');
        }
      }
    });
  };

  const getIcon = (type: Notification['type'], read: boolean) => {
    const iconSize = 20;
    const baseClass = cn(
      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-all",
      read ? "bg-zinc-100 text-zinc-400" : ""
    );

    switch (type) {
      case 'assignment':
        return (
          <div className={cn(baseClass, !read && "bg-blue-50 text-blue-600 shadow-blue-500/10")}>
            <BookOpen size={iconSize} />
          </div>
        );
      case 'reminder':
        return (
          <div className={cn(baseClass, !read && "bg-amber-50 text-amber-600 shadow-amber-500/10")}>
            <Clock size={iconSize} />
          </div>
        );
      case 'submitted':
        return (
          <div className={cn(baseClass, !read && "bg-emerald-50 text-emerald-600 shadow-emerald-500/10")}>
            <CheckCircle2 size={iconSize} />
          </div>
        );
      case 'alert':
        return (
          <div className={cn(baseClass, !read && "bg-rose-50 text-rose-600 shadow-rose-500/10")}>
            <AlertCircle size={iconSize} />
          </div>
        );
    }
  };

  return (
    <div className="animate-in fade-in duration-700 max-w-5xl mx-auto px-4">
      {/* Header section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white shadow-lg shadow-black/10">
              <Bell size={18} />
            </div>
            <h2 className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase font-['Outfit']">Alert Center</h2>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-black font-['Outfit']">Notifications</h1>
          <p className="text-zinc-500 mt-2 text-sm leading-relaxed max-w-md">Stay updated with manuscript assignments, editorial deadlines, and system intelligence.</p>
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

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="animate-spin text-zinc-500" size={32} />
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              onClick={() => {
                if (notification.articleId) {
                  navigate('/reviewer/articles', { state: { highlightId: notification.articleId } });
                }
              }}
              className={cn(
                "group relative bg-white rounded-[2rem] border p-6 flex gap-6 transition-all duration-500",
                notification.articleId ? "cursor-pointer hover:border-zinc-400 hover:shadow-xl hover:shadow-black/[0.02]" : "",
                !notification.read 
                  ? "border-black/5 shadow-2xl shadow-black/[0.03] ring-1 ring-black/[0.02]" 
                  : "border-zinc-100 opacity-60 hover:opacity-100 hover:shadow-xl hover:shadow-black/[0.02]"
              )}
            >
              {/* Context Icon */}
              {getIcon(notification.type, notification.read)}
 
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <h3 className={cn(
                    "text-[10px] font-black tracking-widest uppercase",
                    !notification.read ? "text-black" : "text-zinc-500"
                  )}>
                    {notification.title}
                  </h3>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{notification.timestamp}</span>
                </div>
                
                <p className={cn(
                  "text-sm leading-relaxed mb-4 font-medium",
                  !notification.read ? "text-zinc-600" : "text-zinc-400"
                )}>
                  {notification.message}
                </p>
 
                {/* Clickable Article Link */}
                {notification.articleId && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/reviewer/articles', { state: { highlightId: notification.articleId } });
                    }}
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all shadow-sm cursor-pointer",
                      !notification.read 
                        ? "bg-zinc-900 text-white hover:bg-zinc-800" 
                        : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                    )}
                  >
                    <ExternalLink size={12} />
                    {notification.articleTitle || 'View Manuscript'}
                  </button>
                )}
              </div>

              {/* Unread Indicator & Actions */}
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
                  >
                    <Check size={18} />
                  </button>
                )}
              </div>
              
              {/* Subtle hover arrow */}
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
          <h3 className="text-3xl font-bold text-black mb-3 tracking-tighter font-['Outfit']">Clear Horizon</h3>
          <p className="text-zinc-500 text-sm max-w-sm mb-12 leading-relaxed italic">
            "Your notification archive is currently empty. We'll alert you as soon as a new manuscript requires your expertise."
          </p>
          <button 
            onClick={() => navigate('/reviewer')}
            className="flex items-center gap-3 px-10 py-4 bg-black text-white rounded-2xl text-xs font-bold tracking-widest hover:bg-zinc-800 transition-all shadow-2xl shadow-black/10 active:scale-95"
          >
            RETURN TO OVERVIEW
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewerNotifications;

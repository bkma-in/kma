import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  FileEdit, 
  MessageSquare, 
  Info, 
  Clock, 
  AlertCircle, 
  Loader2, 
  Archive, 
  UserPlus,
  UserCheck,
  UserX,
  FileUp,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../utils/cn';
import api from '../../services/api';
import { db, auth } from '../../config/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../utils/NotificationContext';
import { useAuth } from '../../context/AuthContext';

const Notifications = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('UNREAD');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const rolePathPrefix = currentUser?.role === 'admin' ? '/admin' : '/author';

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let notifs = snapshot.docs.map(doc => ({
        ...doc.data(),
        notificationId: doc.id
      })) as any[];
      
      // Sort in memory to avoid needing a composite index
      notifs.sort((a: any, b: any) => {
        const timeA = a.createdAt?._seconds || (typeof a.createdAt === 'number' ? a.createdAt / 1000 : 0);
        const timeB = b.createdAt?._seconds || (typeof b.createdAt === 'number' ? b.createdAt / 1000 : 0);
        return timeB - timeA;
      });

      setNotifications(notifs);
      setLoading(false);

      // Auto mark as read when on this page
      const unreadIds = notifs.filter(n => !n.read).map(n => n.notificationId);
      if (unreadIds.length > 0) {
        unreadIds.forEach(id => {
          api.patch(`/notifications/${id}/read`).catch(console.error);
        });
      }
    }, (error) => {
      console.error('Real-time notifications error:', error);
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

  const markAsRead = async (id: string) => {
    setIsProcessing(id);
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.notificationId === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    } finally {
      setIsProcessing(null);
    }
  };

  const getNotificationConfig = (notif: any) => {
    switch (notif.type) {
      case 'INVITATION_SENT':
        return {
          title: 'Collaboration Invite',
          icon: UserPlus,
          iconBg: 'bg-amber-50',
          iconColor: 'text-amber-600',
          action: 'VIEW INVITE',
          onClick: () => navigate(`${rolePathPrefix}/articles`, { state: { highlightId: notif.metadata.articleId, openInvite: true } })
        };
      case 'INVITATION_ACCEPTED':
        return {
          title: 'Invite Accepted',
          icon: UserCheck,
          iconBg: 'bg-emerald-50',
          iconColor: 'text-emerald-600',
          action: 'VIEW ARTICLE',
          onClick: () => navigate(`${rolePathPrefix}/articles`, { state: { highlightId: notif.metadata.articleId } })
        };
      case 'INVITATION_REJECTED':
        return {
          title: 'Invite Declined',
          icon: UserX,
          iconBg: 'bg-rose-50',
          iconColor: 'text-rose-600',
          action: 'VIEW REASON',
          onClick: () => navigate(`${rolePathPrefix}/articles`, { state: { highlightId: notif.metadata.articleId } })
        };
      case 'REVISION_SUBMITTED':
        return {
          title: 'Revision Uploaded',
          icon: FileUp,
          iconBg: 'bg-blue-50',
          iconColor: 'text-blue-600',
          action: 'TRACK PROGRESS',
          onClick: () => navigate(`${rolePathPrefix}/articles`, { state: { highlightId: notif.metadata.articleId } })
        };
      case 'REVISION_REQUIRED':
        return {
          title: 'Revision Requested',
          icon: FileEdit,
          iconBg: 'bg-amber-50',
          iconColor: 'text-amber-600',
          action: 'EDIT MANUSCRIPT',
          onClick: () => navigate(`${rolePathPrefix}/articles`, { state: { highlightId: notif.metadata.articleId } })
        };
      default:
        return {
          title: notif.title || 'Notification',
          icon: Info,
          iconBg: 'bg-zinc-100',
          iconColor: 'text-zinc-600',
          action: 'VIEW DETAILS',
          onClick: () => {}
        };
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'UNREAD') return !n.read;
    if (activeTab === 'READ') return n.read;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white shadow-lg">
              <Clock size={18} />
            </div>
            <h2 className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">Communication Hub</h2>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-black font-['Outfit']">Notifications</h1>
          <p className="text-zinc-500 mt-2 text-sm max-w-lg">Manage invitations, review requests, and collaborator updates in real-time.</p>
        </div>

        <div className="flex items-center bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200 shadow-inner">
          {['UNREAD', 'READ', 'ALL'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all",
                activeTab === tab 
                  ? "bg-white text-black shadow-md" 
                  : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-zinc-100 border-t-black rounded-full animate-spin" />
            <p className="text-zinc-500 font-medium text-sm">Synchronizing your alerts...</p>
          </div>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif) => {
            const config = getNotificationConfig(notif);
            return (
              <div 
                key={notif.notificationId}
                className={cn(
                  "group relative p-6 bg-white border rounded-[2rem] transition-all duration-300 hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-1",
                  notif.read ? "border-zinc-100 opacity-80" : "border-zinc-200 shadow-xl shadow-black/[0.02]"
                )}
              >
                {!notif.read && (
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-12 bg-black rounded-full shadow-lg shadow-black/20" />
                )}
                
                <div className="flex items-start gap-6">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                    config.iconBg,
                    config.iconColor
                  )}>
                    <config.icon size={28} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-bold text-black uppercase tracking-tight font-['Outfit']">
                        {config.title}
                      </h3>
                      <span className="text-[10px] font-black text-zinc-300 tracking-widest">
                        {formatTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 font-medium leading-relaxed mb-4">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          config.onClick();
                          if (!notif.read) markAsRead(notif.notificationId);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black tracking-widest hover:bg-black transition-all shadow-xl shadow-black/10 active:scale-95 uppercase"
                      >
                        {config.action}
                        <ArrowRight size={14} />
                      </button>
                      
                      {!notif.read && (
                        <button 
                          onClick={() => markAsRead(notif.notificationId)}
                          disabled={isProcessing === notif.notificationId}
                          className="px-6 py-3 bg-zinc-50 text-zinc-500 border border-zinc-100 rounded-xl text-[10px] font-black tracking-widest hover:bg-zinc-100 transition-all uppercase"
                        >
                          {isProcessing === notif.notificationId ? <Loader2 size={14} className="animate-spin" /> : 'Mark Read'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-20 text-center flex flex-col items-center gap-6 bg-white rounded-[3rem] border border-zinc-100 shadow-xl shadow-black/[0.02]">
            <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-200">
              <Archive size={40} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-black font-['Outfit']">Inbox Zero</h3>
              <p className="text-zinc-400 text-sm mt-1">No {activeTab.toLowerCase()} notifications found at this time.</p>
            </div>
            <button 
              onClick={() => setActiveTab('ALL')}
              className="px-8 py-3 bg-black text-white rounded-xl text-[10px] font-black tracking-widest hover:bg-zinc-800 transition-all"
            >
              VIEW ALL HISTORY
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;

import { useState } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  type: 'assignment' | 'reminder' | 'submitted' | 'alert';
  title: string;
  articleTitle: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const ReviewerNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([
    { 
      id: '1', 
      type: 'assignment', 
      title: 'New Article Assigned', 
      articleTitle: 'Topological Data Analysis in Stochastic Systems',
      message: 'A new manuscript has been assigned for your assessment. Deadline for review: April 30, 2024.', 
      timestamp: '2 hours ago', 
      read: false 
    },
    { 
      id: '2', 
      type: 'reminder', 
      title: 'Pending Review Reminder', 
      articleTitle: 'Advanced Cryptography Protocols v2',
      message: 'Your review for this manuscript is due in 24 hours. Please ensure your assessment is submitted on time.', 
      timestamp: '5 hours ago', 
      read: false 
    },
    { 
      id: '3', 
      type: 'submitted', 
      title: 'Review Successfully Logged', 
      articleTitle: 'Non-linear Dynamics in Quantum Geometry',
      message: 'Your expert review has been received by the editorial board. Thank you for your contribution.', 
      timestamp: 'Yesterday', 
      read: true 
    },
    { 
      id: '4', 
      type: 'alert', 
      title: 'Submission Window Closing', 
      articleTitle: 'KMA Volume 15 Issue 1',
      message: 'The current submission window for the Global Archive will close in 48 hours.', 
      timestamp: '2 days ago', 
      read: true 
    }
  ]);

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    if (confirm('Are you sure you want to clear all notifications?')) {
      setNotifications([]);
    }
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
          <div className={cn(baseClass, !read && "bg-blue-50 text-blue-600")}>
            <BookOpen size={iconSize} />
          </div>
        );
      case 'reminder':
        return (
          <div className={cn(baseClass, !read && "bg-amber-50 text-amber-600")}>
            <Clock size={iconSize} />
          </div>
        );
      case 'submitted':
        return (
          <div className={cn(baseClass, !read && "bg-emerald-50 text-emerald-600")}>
            <CheckCircle2 size={iconSize} />
          </div>
        );
      case 'alert':
        return (
          <div className={cn(baseClass, !read && "bg-rose-50 text-rose-600")}>
            <AlertCircle size={iconSize} />
          </div>
        );
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto">
      {/* Header section */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white">
              <Bell size={18} />
            </div>
            <h2 className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">Alert Center</h2>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-black">Notifications</h1>
          <p className="text-zinc-500 mt-2 text-sm">Stay updated with assignments, deadlines, and system updates.</p>
        </div>

        <div className="flex items-center gap-4">
          {notifications.length > 0 && (
            <>
              <button 
                onClick={markAllAsRead}
                className="text-[10px] font-black text-zinc-400 hover:text-black uppercase tracking-widest flex items-center gap-2 transition-all"
              >
                <Check size={14} />
                Mark all as read
              </button>
              <button 
                onClick={clearAll}
                className="text-[10px] font-black text-rose-400 hover:text-rose-600 uppercase tracking-widest flex items-center gap-2 transition-all"
              >
                <Trash2 size={14} />
                Clear All
              </button>
            </>
          )}
        </div>
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={cn(
                "group relative bg-white rounded-3xl border p-6 flex gap-6 transition-all",
                !notification.read 
                  ? "border-black/5 shadow-xl shadow-black/5 ring-1 ring-black/5" 
                  : "border-zinc-100 opacity-60 hover:opacity-100"
              )}
            >
              {/* Context Icon */}
              {getIcon(notification.type, notification.read)}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <h3 className={cn(
                    "text-sm font-bold tracking-tight uppercase",
                    !notification.read ? "text-black" : "text-zinc-500"
                  )}>
                    {notification.title}
                  </h3>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{notification.timestamp}</span>
                </div>
                
                <p className={cn(
                  "text-xs leading-relaxed mb-3",
                  !notification.read ? "text-zinc-600" : "text-zinc-400"
                )}>
                  {notification.message}
                </p>

                {/* Clickable Article Link */}
                <button 
                  onClick={() => navigate('/reviewer-dashboard/articles')}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all",
                    !notification.read 
                      ? "bg-zinc-900 text-white hover:bg-zinc-700" 
                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                  )}
                >
                  <ExternalLink size={12} />
                  {notification.articleTitle}
                </button>
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
                    onClick={() => markAsRead(notification.id)}
                    className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-300 hover:text-black transition-all group-hover:scale-110"
                    title="Mark as read"
                  >
                    <Check size={18} />
                  </button>
                )}
              </div>
              
              {/* Subtle hover arrow */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                <ChevronRight size={20} className="text-zinc-200" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] p-24 border border-zinc-100 shadow-sm text-center flex flex-col items-center animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mb-8 border-4 border-white shadow-inner">
            <Inbox size={40} className="text-zinc-200" />
          </div>
          <h3 className="text-2xl font-bold text-black mb-2 tracking-tight">All caught up!</h3>
          <p className="text-zinc-500 text-sm max-w-sm mb-10 leading-relaxed italic">
            "Your notification archive is currently empty. We'll alert you as soon as a new manuscript is assigned or a deadline approaches."
          </p>
          <button 
            onClick={() => navigate('/reviewer-dashboard')}
            className="flex items-center gap-3 px-8 py-4 bg-black text-white rounded-2xl text-xs font-bold tracking-[0.2em] hover:bg-zinc-800 transition-all shadow-xl shadow-black/10 active:scale-95"
          >
            RETURN TO OVERVIEW
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewerNotifications;

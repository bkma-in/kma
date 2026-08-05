import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, BellOff, ArrowRight } from 'lucide-react';
import logo from '../assets/logo.png';
import { useNotification } from '../utils/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { cn } from '../utils/cn';

interface GlobalHeaderProps {
  onMenuClick: () => void;
  portalName?: string;
  rightActions?: React.ReactNode;
}

const GlobalHeader: React.FC<GlobalHeaderProps> = ({ 
  onMenuClick, 
  portalName = 'USER PORTAL', 
  rightActions
}) => {
  const { unreadCount } = useNotification();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let notifs = snapshot.docs.map(doc => ({
        notificationId: doc.id,
        ...doc.data()
      }));

      // Sort by createdAt desc in memory
      notifs.sort((a: any, b: any) => {
        const getTimestamp = (val: any) => {
          if (!val) return 0;
          if (typeof val.toMillis === 'function') return val.toMillis();
          if (val.seconds) return val.seconds * 1000;
          return new Date(val).getTime() || 0;
        };
        return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);
      });

      setNotifications(notifs.slice(0, 5));
    }, (err) => {
      console.error('[GlobalHeader] Error listening to notifications:', err);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const getRolePrefix = () => {
    const role = currentUser?.role;
    if (role === 'admin') return '/admin';
    if (role === 'author') return '/author';
    if (role === 'reviewer') return '/reviewer';
    if (role === 'reader') return '/reader';
    if (role === 'dev') return '/dev';
    return '';
  };

  const notificationsPath = `${getRolePrefix()}/notifications`;

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 px-6 flex items-center justify-between border-b border-zinc-200 bg-white/80 backdrop-blur-md z-20 shadow-sm overflow-hidden">
      {/* 1. Logo (Left) */}
      <div className="flex items-center gap-3 shrink-0 relative z-10">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-black hover:text-zinc-600 transition-colors p-2 -ml-2"
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>
        <div className="w-10 h-10 bg-white rounded-lg p-1.5 shadow-sm flex items-center justify-center overflow-hidden border border-zinc-100">
          <img src={logo} alt="BKMA Logo" className="w-full h-full object-contain" />
        </div>
      </div>

      {/* 2. Title (Compact) */}
      <div className="flex-1 px-4 relative z-10 overflow-hidden">
        <h2 className="text-lg lg:text-xl font-bold tracking-tight text-black font-['Outfit'] truncate">
          Bulletin of Kerala Mathematics Association
        </h2>
      </div>

      {/* 3. Right Actions (Search + Notifications) */}
      <div className="flex items-center gap-4 relative z-10 shrink-0">
        <div className="hidden sm:block">
          {rightActions}
        </div>
        
        {/* Notifications Icon with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative p-2.5 rounded-full bg-zinc-50 border border-zinc-100 hover:bg-zinc-100 transition-all text-zinc-650 hover:text-black focus:outline-none"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Popover Dropdown Panel */}
          {showDropdown && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-zinc-200 rounded-2xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-zinc-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Recent Notifications</span>
                <Link 
                  to={notificationsPath}
                  onClick={() => setShowDropdown(false)}
                  className="text-[9px] font-black text-black hover:text-zinc-600 uppercase tracking-widest flex items-center gap-1"
                >
                  View All <ArrowRight size={10} />
                </Link>
              </div>
              <div className="divide-y divide-zinc-50 max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div 
                      key={n.notificationId} 
                      onClick={() => {
                        setShowDropdown(false);
                        navigate(notificationsPath);
                      }}
                      className={cn(
                        "p-3.5 flex items-start gap-3 hover:bg-zinc-50 transition-colors cursor-pointer text-left",
                        !n.read && "bg-zinc-50/50"
                      )}
                    >
                      <div className="flex-1 space-y-1">
                        <p className={cn("text-xs leading-snug text-zinc-800", !n.read ? "font-bold" : "font-medium")}>
                          {n.title}
                        </p>
                        <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">{n.type || 'NOTIFICATION'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-zinc-400 text-xs italic flex flex-col items-center justify-center gap-2">
                    <BellOff size={24} className="text-zinc-300" />
                    <span>No notifications yet</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default GlobalHeader;

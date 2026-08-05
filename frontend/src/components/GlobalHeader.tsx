import React from 'react';
import { Menu, Bell } from 'lucide-react';
import logo from '../assets/logo.png';
import { useNotification } from '../utils/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

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

      {/* 3. Right Actions (Search + Notifications Link) */}
      <div className="flex items-center gap-4 relative z-10 shrink-0">
        <div className="hidden sm:block">
          {rightActions}
        </div>
        
        {/* Notifications Icon (Navigates to notifications page) */}
        <Link 
          to={notificationsPath}
          className="relative p-2.5 rounded-full bg-zinc-50 border border-zinc-100 hover:bg-zinc-100 transition-all text-zinc-650 hover:text-black focus:outline-none"
          aria-label="Notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
};

export default GlobalHeader;

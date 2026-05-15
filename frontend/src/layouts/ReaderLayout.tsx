import React from 'react';
import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CreditCard, 
  Bell, 
  Bookmark, 
  User, 
  LogOut, 
  X, 
  HelpCircle,
  Lock,
  Zap
} from 'lucide-react';
import { cn } from '../utils/cn';
import SidebarHeader from '../components/SidebarHeader';
import GlobalHeader from '../components/GlobalHeader';
import GlobalFooter from '../components/GlobalFooter';
import ReportIssueModal from '../components/ReportIssueModal';
import { useNotification } from '../utils/NotificationContext';
import { useProfile } from '../hooks/useProfile';
import { useSubscription } from '../utils/SubscriptionContext';

const ReaderLayout = () => {
  const { confirm, showToast } = useNotification();
  const { profile } = useProfile();
  const { isSubscribed } = useSubscription();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    confirm({
      title: 'Confirm Logout',
      message: 'Are you sure you want to log out of the Reader Portal?',
      confirmText: 'Logout',
      onConfirm: () => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('role');
        showToast('Logged out successfully', 'success');
        navigate('/auth');
      }
    });
  };

  const navItems = [
    { name: 'Dashboard', path: '/reader/dashboard', end: true, icon: LayoutDashboard, locked: false },
    { name: 'Payments', path: '/reader/payments', icon: CreditCard, locked: !isSubscribed },
    { name: 'Notifications', path: '/reader/notifications', icon: Bell, locked: !isSubscribed },
    { name: 'Saved Articles', path: '/reader/saved', icon: Bookmark, locked: !isSubscribed },
    { name: 'Profile', path: '/reader/profile', icon: User, locked: false },
  ];

  const handleLockedClick = (e: React.MouseEvent, item: typeof navItems[0]) => {
    if (item.locked) {
      e.preventDefault();
      confirm({
        title: 'Feature Locked',
        message: 'A KMA Reader Subscription is required to access this feature. Would you like to view our plans?',
        confirmText: 'View Plans',
        onConfirm: () => navigate('/reader/get-subscription')
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 font-['Outfit'] lg:pl-64">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "w-64 bg-black text-white flex flex-col fixed left-0 top-0 h-full z-30 transition-transform duration-300",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="relative">
          <SidebarHeader portalName="Reader Portal" />
          <button 
            className="lg:hidden text-zinc-400 hover:text-white absolute right-4 top-1/2 -translate-y-1/2"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 mt-6 lg:mt-8 space-y-1.5 px-4 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.locked ? '#' : item.path}
              end={item.end}
              onClick={(e) => {
                if (item.locked) {
                  handleLockedClick(e, item);
                } else {
                  setIsSidebarOpen(false);
                }
              }}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                  isActive && !item.locked
                    ? "bg-zinc-800/80 text-white shadow-lg ring-1 ring-white/10" 
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900",
                  item.locked && "opacity-50 cursor-not-allowed hover:bg-transparent"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className={cn(
                      "transition-transform group-hover:scale-110",
                      isActive && !item.locked ? "text-white" : "text-zinc-600"
                    )} />
                    {item.name}
                  </div>
                  {item.locked ? (
                    <Lock size={14} className="text-zinc-600" />
                  ) : isActive && (
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                  )}
                </>
              )}
            </NavLink>
          ))}

          {!isSubscribed && (
            <NavLink
              to="/reader/get-subscription"
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-bold transition-all duration-300 mt-6 border border-white/5",
                  isActive 
                    ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
                    : "bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white"
                )
              }
            >
              <Zap size={18} className="animate-pulse" />
              Get Subscription
            </NavLink>
          )}
        </nav>

        <div className="p-4 mb-4 border-t border-white/5 mt-auto">
          <button 
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-3 px-4 py-3 w-full bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-sm font-medium transition-all mb-4 border border-white/5"
          >
            <HelpCircle size={18} className="text-zinc-500" />
            Need Help?
          </button>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:text-red-300 hover:bg-zinc-900 rounded-lg text-sm font-medium transition-all"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen w-full">
        {/* Global Header */}
        <GlobalHeader 
          onMenuClick={() => setIsSidebarOpen(true)} 
          userName={profile?.name || "Premium Reader"}
          userInitials={profile?.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : "R"}
        />

        {/* Page Content */}
        <div className="pt-20 lg:pt-24 p-4 sm:p-6 lg:p-10 flex-1 max-w-6xl mx-auto w-full overflow-y-auto">
          <Outlet />
        </div>

        {/* Global Footer */}
        <GlobalFooter />
      </main>

      <ReportIssueModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        userRole="reader"
      />
    </div>
  );
};

export default ReaderLayout;

import { useState } from 'react';
import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { LayoutDashboard, FileEdit, BookOpen, Inbox, Bell, Search, LogOut, X, HelpCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import SidebarHeader from '../components/SidebarHeader';
import GlobalHeader from '../components/GlobalHeader';
import GlobalFooter from '../components/GlobalFooter';
import ReportIssueModal from '../components/ReportIssueModal';
import { useNotification } from '../utils/NotificationContext';
import { useProfile } from '../hooks/useProfile';

const AuthorLayout = () => {
  const { confirm, showToast } = useNotification();
  const { profile } = useProfile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const navigate = useNavigate();

  // Route protection & Dynamic User Data
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const role = localStorage.getItem('role');
  const userName = profile?.name || localStorage.getItem('userName') || 'Author User';
  const userInitials = profile?.name 
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (localStorage.getItem('userName') || 'AU').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  if (!isLoggedIn || (role !== 'author' && role !== 'reader')) {
    return <Navigate to="/auth" replace />;
  }

  const handleLogout = () => {
    confirm({
      title: 'Confirm Logout',
      message: 'Are you sure you want to log out of the Author Portal?',
      confirmText: 'Logout',
      onConfirm: () => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('role');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        showToast('Logged out successfully', 'success');
        navigate('/auth');
      }
    });
  };

  const navItems = [
    { name: 'Dashboard', path: '/author/dashboard', end: true, icon: LayoutDashboard },
    { name: 'Submit Article', path: '/author/submit', icon: FileEdit },
    { name: 'My Articles', path: '/author/articles', icon: BookOpen },
    { name: 'Drafts', path: '/author/drafts', icon: Inbox },
    { name: 'Notifications', path: '/author/notifications', icon: Bell, badge: 3 },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-50 font-['Outfit'] lg:pl-64">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "w-64 bg-black text-white flex flex-col fixed left-0 top-0 h-full z-30 transition-transform duration-300",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="relative">
          <SidebarHeader portalName="Author Portal" />
          <button 
            className="lg:hidden text-zinc-400 hover:text-white absolute right-4 top-1/2 -translate-y-1/2"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 mt-6 lg:mt-8 space-y-1 px-4 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 relative",
                  isActive 
                    ? "bg-zinc-800/80 text-white shadow-lg ring-1 ring-white/10" 
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <item.icon size={18} />
                    {item.name}
                  </div>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 mb-4 border-t border-zinc-800 mt-auto">
          {/* Help Button - Now the main action in sidebar footer */}
          <button 
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-3 px-4 py-3 w-full bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-sm font-medium transition-all mb-4 border border-white/5"
          >
            <HelpCircle size={18} className="text-zinc-500" />
            Need Help?
          </button>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:text-red-300 hover:bg-zinc-900 rounded-lg text-sm font-medium transition-colors"
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
          userName={userName}
          userInitials={userInitials}
          portalName="AUTHOR PORTAL"
          rightActions={
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input 
                type="text" 
                placeholder="SEARCH ARCHIVE..." 
                className="pl-10 pr-4 py-2 bg-black/5 border-none rounded-lg text-xs font-medium w-48 lg:w-64 focus:ring-1 focus:ring-black outline-none"
              />
            </div>
          }
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
        userRole="author"
      />
    </div>
  );
};

export default AuthorLayout;

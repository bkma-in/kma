import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Bug, 
  LogOut, 
  X
} from 'lucide-react';
import { cn } from '../utils/cn';
import SidebarHeader from '../components/SidebarHeader';
import GlobalHeader from '../components/GlobalHeader';
import GlobalFooter from '../components/GlobalFooter';
import { useNotification } from '../utils/NotificationContext';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../context/AuthContext';

const DeveloperLayout = () => {
  const { confirm, showToast } = useNotification();
  const { profile } = useProfile();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const userName = profile?.name || localStorage.getItem('userName') || 'Developer User';
  const userInitials = profile?.name 
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (localStorage.getItem('userName') || 'DV').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleLogout = () => {
    confirm({
      title: 'Confirm Logout',
      message: 'Are you sure you want to log out of the Developer Portal?',
      confirmText: 'Logout',
      onConfirm: async () => {
        try {
          await logout();
          showToast('Logged out successfully', 'success');
          navigate('/auth?mode=login');
        } catch (error) {
          showToast('Logout failed', 'error');
        }
      }
    });
  };

  const navItems = [
    { name: 'Dashboard', path: '/dev/dashboard', end: true, icon: LayoutDashboard },
    { name: 'Issues List', path: '/dev/issues', icon: Bug },
  ];

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
          <SidebarHeader portalName="Dev Portal" />
          <button 
            className="lg:hidden text-zinc-400 hover:text-white absolute right-4 top-1/2 -translate-y-1/2"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 mt-6 lg:mt-8 space-y-2 px-4 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.end}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 relative",
                  isActive 
                    ? "bg-zinc-800/80 text-white shadow-lg ring-1 ring-white/10" 
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} />
                  {item.name}
                  {isActive && (
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800 mb-4 mt-auto">
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
          userName={userName}
          userInitials={userInitials}
          portalName="DEV PORTAL"
        />

        {/* Page Content */}
        <div className="pt-20 lg:pt-24 p-4 sm:p-6 lg:p-8 flex-1 w-full max-w-7xl mx-auto overflow-y-auto">
          <Outlet />
        </div>
        
        {/* Global Footer */}
        <GlobalFooter />
      </main>
    </div>
  );
};

export default DeveloperLayout;

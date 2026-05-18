import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Bug, 
  LogOut, 
  X, 
  Menu,
  Terminal,
  User
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useNotification } from '../utils/NotificationContext';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../context/AuthContext';
import ProfileModal from '../components/ProfileModal';
import GlobalFooter from '../components/GlobalFooter';

const DeveloperLayout = () => {
  const { confirm, showToast } = useNotification();
  const { profile, updateProfile } = useProfile();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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
        <div className="flex items-center gap-3 px-6 py-8">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <Terminal className="text-black" size={24} />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tighter">KMA</h1>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Dev Portal</p>
          </div>
          <button 
            className="lg:hidden ml-auto text-zinc-400 hover:text-white"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.end}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                  isActive 
                    ? "bg-zinc-800 text-white" 
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} />
                  {item.name}
                  {isActive && (
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-3 px-4 py-3 w-full text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg text-sm font-medium transition-all mb-2"
          >
            <User size={18} />
            My Profile
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
      <main className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 lg:h-20 bg-white border-b border-zinc-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10">
          <button 
            className="lg:hidden p-2 text-zinc-600"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-zinc-900">{profile?.name || 'Developer'}</p>
              <p className="text-[10px] text-zinc-500 font-medium">System Administrator</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-sm">
              {profile?.name ? profile.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'DV'}
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8 flex-1">
          <Outlet />
        </div>
        <GlobalFooter />
      </main>

      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        profile={profile}
        onSave={updateProfile}
      />
    </div>
  );
};

export default DeveloperLayout;

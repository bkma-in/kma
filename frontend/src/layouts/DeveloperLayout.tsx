import { useState } from 'react';
import { auth } from '../config/firebase';
import { Outlet, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Bug, 
  LogOut, 
  X, 
  Menu,
  Terminal
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useNotification } from '../utils/NotificationContext';
import { useProfile } from '../hooks/useProfile';
import ProfileModal from '../components/ProfileModal';

const DeveloperLayout = () => {
  const { confirm, showToast } = useNotification();
  const { profile, updateProfile } = useProfile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    confirm({
      title: 'Confirm Logout',
      message: 'Are you sure you want to log out of the Developer Portal?',
      confirmText: 'Logout',
      onConfirm: async () => {
        try {
          await auth.signOut();
          localStorage.clear();
          sessionStorage.clear();
          window.location.replace('/auth?mode=login');
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
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black shadow-xl shadow-white/5">
              <Terminal size={24} />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tighter text-white">DEV_PORTAL</h1>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">v1.0.4-stable</p>
            </div>
          </div>
          <button 
            className="lg:hidden text-zinc-400 hover:text-white"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 mt-8 space-y-1.5 px-4 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.end}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                  isActive 
                    ? "bg-white text-black shadow-lg" 
                    : "text-zinc-500 hover:text-white hover:bg-white/5"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className={cn(
                      "transition-transform group-hover:scale-110",
                      isActive ? "text-black" : "text-zinc-600"
                    )} />
                    {item.name}
                  </div>
                  {isActive && <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-black rounded-full" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 mb-4 border-t border-white/5 mt-auto">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-zinc-500 hover:text-rose-500 hover:bg-rose-500/5 rounded-xl text-sm font-medium transition-all"
          >
            <LogOut size={18} />
            System Exit
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen w-full bg-zinc-50">
        {/* Global Header */}
        <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 px-6 flex items-center justify-between border-b border-zinc-200 bg-white/80 backdrop-blur-xl z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-black"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">System Live</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-4 hover:opacity-80 transition-opacity"
            >
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-black leading-none tracking-tight">
                  {profile?.name || "Senior Developer"}
                </p>
                <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                  Security Level 4
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-black text-white border border-zinc-100 overflow-hidden flex items-center justify-center font-bold text-[10px] shadow-sm">
                {profile?.profileImage ? (
                  <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  profile?.name?.[0] || "D"
                )}
              </div>
            </button>
          </div>
        </header>

        <ProfileModal 
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          profile={profile}
          onSave={updateProfile}
        />

        {/* Page Content */}
        <div className="pt-24 p-6 lg:p-10 flex-1 w-full overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DeveloperLayout;

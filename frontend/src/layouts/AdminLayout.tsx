import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, LogOut, X, Search, HelpCircle, Bell, UploadCloud, ChevronDown, ChevronUp, UserCheck, BookOpen, User } from 'lucide-react';
import { cn } from '../utils/cn';
import SidebarHeader from '../components/SidebarHeader';
import GlobalHeader from '../components/GlobalHeader';
import GlobalFooter from '../components/GlobalFooter';
import ReportIssueModal from '../components/ReportIssueModal';
import { useNotification } from '../utils/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import api from '../services/api';
import { SkeletonStatistics } from '../components/skeletons/SkeletonStatistics';
import { SkeletonArticleCard } from '../components/skeletons/SkeletonArticleCard';
import { SkeletonTable } from '../components/skeletons/SkeletonTable';
import { SkeletonNotification } from '../components/skeletons/SkeletonNotification';

interface AdminLayoutProps {
  isLoadingSkeleton?: boolean;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ isLoadingSkeleton = false }) => {
  const { confirm, showToast, unreadCount, clearUnread } = useNotification();
  const { profile } = useProfile();
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const renderSkeletonContent = () => {
    const path = location.pathname;
    if (path.endsWith('/dashboard')) {
      return (
        <div className="space-y-8">
          <div className="space-y-2">
            <div className="h-8 bg-zinc-200 rounded w-1/4" />
            <div className="h-4 bg-zinc-200 rounded w-1/3" />
          </div>
          <SkeletonStatistics />
          <div className="space-y-4">
            <div className="h-6 bg-zinc-200 rounded w-1/6" />
            <SkeletonArticleCard count={3} />
          </div>
        </div>
      );
    }
    if (path.includes('/notifications')) {
      return (
        <div className="space-y-6">
          <div className="h-8 bg-zinc-200 rounded w-1/4 mb-6" />
          <SkeletonNotification count={5} />
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <div className="h-8 bg-zinc-200 rounded w-1/4 mb-6" />
        <SkeletonTable />
      </div>
    );
  };
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isUsersDropdownOpen, setIsUsersDropdownOpen] = useState(false);
  const [counts, setCounts] = useState({
    reviewers: 0
  });

  const getTimestamp = (val: any) => {
    if (!val) return 0;
    if (typeof val.toMillis === 'function') return val.toMillis();
    if (val.seconds) return val.seconds * 1000;
    if (val._seconds) return val._seconds * 1000;
    return new Date(val).getTime() || 0;
  };

  const formatBadgeCount = (count: number) => {
    if (count <= 0) return null;
    if (count > 99) return '99+';
    return count.toString();
  };

  // Immediate UI clearing when navigating to notifications
  useEffect(() => {
    if (location.pathname === '/admin/notifications') {
      clearUnread();
    }
  }, [location.pathname, clearUnread]);

  // Auto-expand users dropdown if we are on user directory paths
  useEffect(() => {
    if (
      location.pathname.startsWith('/admin/reviewers') ||
      location.pathname.startsWith('/admin/authors') ||
      location.pathname.startsWith('/admin/readers')
    ) {
      setIsUsersDropdownOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!currentUser?.uid) return;

    // Pending reviewer applications query
    const qReviewers = query(
      collection(db, 'users'),
      where('role', '==', 'reviewer'),
      where('status', '==', 'Pending')
    );

    const unsubscribeReviewers = onSnapshot(qReviewers, (snapshot) => {
      setCounts(prev => ({ ...prev, reviewers: snapshot.size }));
    });

    return () => {
      unsubscribeReviewers();
    };
  }, [currentUser?.uid]);

  // Route protection & Dynamic User Data
  // App.tsx handles the primary Firebase auth check — no localStorage redirect here
  const role = localStorage.getItem('role');
  const userName = profile?.name || localStorage.getItem('userName') || 'Admin Manager';
  const userInitials = profile?.name 
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (localStorage.getItem('userName') || 'AM').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleLogout = () => {
    confirm({
      title: 'Confirm Logout',
      message: 'Are you sure you want to log out of the Admin Portal?',
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
    { name: 'Dashboard', path: '/admin/dashboard', end: true, icon: LayoutDashboard },
    {
      name: 'Users',
      icon: Users,
      isDropdown: true,
      children: [
        { name: 'Reviewers', path: '/admin/reviewers', icon: UserCheck, badge: formatBadgeCount(counts.reviewers) },
        { name: 'Authors', path: '/admin/authors-list', icon: User },
        { name: 'Readers', path: '/admin/readers', icon: BookOpen }
      ]
    },
    { name: 'Articles', path: '/admin/articles', icon: FileText },
    { name: 'Ready to Publish', path: '/admin/ready-to-publish', icon: UploadCloud },
    { name: 'Notifications', path: '/admin/notifications', icon: Bell, badge: formatBadgeCount(unreadCount) },
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
          <SidebarHeader portalName="Admin Portal" />
          <button
            className="lg:hidden text-zinc-400 hover:text-white absolute right-4 top-1/2 -translate-y-1/2"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 mt-6 lg:mt-8 space-y-1 px-4 overflow-y-auto">
          {navItems.map((item) => {
            if (item.isDropdown) {
              return (
                <div key={item.name} className="space-y-1">
                  <button
                    onClick={() => setIsUsersDropdownOpen(!isUsersDropdownOpen)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
                      isUsersDropdownOpen 
                        ? "text-white bg-zinc-900/60" 
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} />
                      <span>{item.name}</span>
                    </div>
                    {isUsersDropdownOpen ? (
                      <ChevronUp size={16} className="text-zinc-400" />
                    ) : (
                      <ChevronDown size={16} className="text-zinc-400" />
                    )}
                  </button>

                  {isUsersDropdownOpen && item.children && (
                    <div className="mt-1 ml-6 pl-4 border-l border-zinc-800 space-y-1 relative">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.name}
                          to={child.path}
                          onClick={() => setIsSidebarOpen(false)}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 relative",
                              isActive
                                ? "bg-zinc-800 text-white shadow-sm ring-1 ring-white/5"
                                : "text-zinc-500 hover:text-white hover:bg-zinc-950"
                            )
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <div className="flex items-center gap-2.5">
                                <child.icon size={15} />
                                <span>{child.name}</span>
                              </div>
                              {child.badge && (
                                <span className="bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center leading-none">
                                  {child.badge}
                                </span>
                              )}
                              {isActive && (
                                <div className="absolute left-[-17px] top-1/4 bottom-1/4 w-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                              )}
                            </>
                          )}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.name}
                to={item.path!}
                end={item.end}
                onClick={() => setIsSidebarOpen(false)}
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
            );
          })}
        </nav>

        <div className="p-4 mb-4 border-t border-zinc-800 mt-auto">
          {/* Help Button */}
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
          userName={isLoadingSkeleton ? '' : userName}
          userInitials={isLoadingSkeleton ? '' : userInitials}
          portalName="ADMIN PORTAL"
          showProfile={!isLoadingSkeleton}
          rightActions={
            <div className="flex items-center gap-4">
              {isLoadingSkeleton ? (
                <div className="w-8 h-8 rounded-full bg-zinc-200 animate-pulse" />
              ) : (
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="SEARCH ARCHIVE..." 
                    className="pl-10 pr-4 py-2 bg-black/5 border-none rounded-lg text-xs font-medium w-48 lg:w-64 focus:ring-1 focus:ring-black outline-none"
                  />
                </div>
              )}
            </div>
          }
        />

        {/* Page Content */}
        <div className="pt-20 lg:pt-24 p-4 sm:p-6 lg:p-8 flex-1 w-full overflow-y-auto">
          {isLoadingSkeleton ? renderSkeletonContent() : <Outlet />}
        </div>

        {/* Global Footer */}
        <GlobalFooter />
      </main>

      <ReportIssueModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        userRole="admin"
      />
    </div>
  );
};

export default AdminLayout;

import { useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileEdit, BookOpen, Inbox, Bell, Search, LogOut, X, HelpCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import SidebarHeader from '../components/SidebarHeader';
import GlobalHeader from '../components/GlobalHeader';
import GlobalFooter from '../components/GlobalFooter';
import ReportIssueModal from '../components/ReportIssueModal';
import { useNotification } from '../utils/NotificationContext';
import { useProfile } from '../hooks/useProfile';
import { getArticles } from '../services/article.service';

const AuthorLayout = () => {
  const { confirm, showToast } = useNotification();
  const { profile } = useProfile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const location = useLocation();
  const [counts, setCounts] = useState({
    drafts: 0,
    articles: 0,
    notifications: 0
  });

  // Track last viewed timestamps
  useEffect(() => {
    const now = Date.now();
    if (location.pathname === '/author/articles') localStorage.setItem('lastViewed_articles', now.toString());
    if (location.pathname === '/author/drafts') localStorage.setItem('lastViewed_drafts', now.toString());
    if (location.pathname === '/author/notifications') localStorage.setItem('lastViewed_notifications', now.toString());
    
    // Auto-close sidebar on mobile after navigation
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!profile?.uid) return;
    
    // 1. Real-time Notifications Listener (Unread only)
    const qNotif = query(
      collection(db, 'notifications'), 
      where('userId', '==', profile.uid),
      where('read', '==', false)
    );
    
    const getTimestamp = (val: any) => {
      if (!val) return 0;
      if (typeof val.toMillis === 'function') return val.toMillis();
      if (val.seconds) return val.seconds * 1000;
      if (val._seconds) return val._seconds * 1000;
      return new Date(val).getTime() || 0;
    };

    const unsubscribeNotif = onSnapshot(qNotif, (snapshot) => {
      setCounts(prev => ({ ...prev, notifications: snapshot.size }));
    });

    // 2. Real-time Articles Listener (For Drafts and Articles badges)
    const qArticles = query(
      collection(db, 'articles'),
      where('participantIds', 'array-contains', profile.uid)
    );

    const unsubscribeArticles = onSnapshot(qArticles, (snapshot) => {
      const lastViewedArticles = parseInt(localStorage.getItem('lastViewed_articles') || '0');
      const lastViewedDrafts = parseInt(localStorage.getItem('lastViewed_drafts') || '0');

      const articles = snapshot.docs.map(doc => doc.data());

      // Personal Drafts: user is author, and it's a draft, and updated since last view
      const draftsCount = articles.filter((a: any) => {
        const time = getTimestamp(a.updatedAt || a.createdAt);
        const isPersonalDraft = a.status === 'draft' && a.authorId === profile.uid && (!a.participantIds || a.participantIds.length <= 1);
        return isPersonalDraft && time > lastViewedDrafts;
      }).length;

      // My Articles: Action needed (Revision requested) OR Pending invitation
      // ONLY show if updated since last view OR specifically pending invitation
      const articlesCount = articles.filter((a: any) => {
        const time = getTimestamp(a.updatedAt || a.createdAt);
        const isRevisionNeeded = a.status === 'revision_requested' && a.authorId === profile.uid && time > lastViewedArticles;
        const isPendingInvitation = a.status === 'draft' && a.authors?.some((auth: any) => 
          auth.userId === profile.uid && !auth.accepted
        ) && time > lastViewedArticles;
        
        return isRevisionNeeded || isPendingInvitation;
      }).length;

      setCounts(prev => ({ 
        ...prev, 
        drafts: draftsCount, 
        articles: articlesCount 
      }));
    });

    return () => {
      unsubscribeNotif();
      unsubscribeArticles();
    };
  }, [profile?.uid, location.pathname]);

  const role = localStorage.getItem('role');
  const userName = profile?.name || localStorage.getItem('userName') || 'Author User';
  const userInitials = profile?.name 
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (localStorage.getItem('userName') || 'AU').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleLogout = () => {
    confirm({
      title: 'Confirm Logout',
      message: 'Are you sure you want to log out of the Author Portal?',
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
    { name: 'Dashboard', path: '/author/dashboard', end: true, icon: LayoutDashboard },
    { name: 'Submit Article', path: '/author/submit', icon: FileEdit },
    { name: 'My Articles', path: '/author/articles', icon: BookOpen, badge: counts.articles > 0 ? counts.articles : null },
    { name: 'Drafts', path: '/author/drafts', icon: Inbox, badge: counts.drafts > 0 ? counts.drafts : null },
    { name: 'Notifications', path: '/author/notifications', icon: Bell, badge: counts.notifications > 0 ? counts.notifications : null },
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

import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './config/firebase';
import { Loader2 } from 'lucide-react';
import Auth from './pages/Auth'
import LandingPage from './pages/LandingPage'
import ToastContainer from './components/notifications/ToastContainer'
import ConfirmModal from './components/notifications/ConfirmModal'
import AuthorLayout from './layouts/AuthorLayout'
import Dashboard from './pages/author/Dashboard'
import MyArticles from './pages/author/MyArticles'
import SubmitArticle from './pages/author/SubmitArticle'
import Notifications from './pages/author/Notifications'
import Drafts from './pages/author/Drafts'
import AdminLayout from './layouts/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminAuthors from './pages/admin/AdminAuthors'
import AdminArticles from './pages/admin/AdminArticles'
import ReviewerLayout from './layouts/ReviewerLayout'
import ReviewerDashboard from './pages/reviewer/ReviewerDashboard'
import ReviewerArticles from './pages/reviewer/ReviewerArticles'
import ReviewerNotifications from './pages/reviewer/ReviewerNotifications'
import DeveloperLayout from './layouts/DeveloperLayout'
import DeveloperDashboard from './pages/developer/DeveloperDashboard'
import DeveloperIssues from './pages/developer/DeveloperIssues'

function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  // EXTREME back-button paralysis: only active on main dashboard landing paths
  useEffect(() => {
    if (!user) return;
    
    const dashboardPaths = [
      '/author', 
      '/author/dashboard',
      '/admin-dashboard', 
      '/reviewer-dashboard', 
      '/developer-dashboard'
    ];
    
    const currentPath = window.location.pathname;
    const isDashboard = dashboardPaths.some(p => currentPath === p);

    if (!isDashboard) return;

    // Overwrite history immediately to make the current page the "forward" state
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      // Force the browser 'forward' again
      window.history.forward();
      window.history.pushState(null, '', window.location.href);
    };

    window.addEventListener('popstate', handlePopState);
    window.history.forward();

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [user, location.pathname]);

  if (initializing) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-zinc-300" size={48} />
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Initializing KMA Portal</p>
        </div>
      </div>
    );
  }

  const getDashboardRedirect = () => {
    const role = localStorage.getItem('role');
    if (role === 'admin') return '/admin-dashboard';
    if (role === 'reviewer') return '/reviewer-dashboard';
    if (role === 'developer') return '/developer-dashboard';
    return '/author';
  };

  return (
    <div className="w-full min-h-screen">
      <ToastContainer />
      <ConfirmModal />
      <Routes>
        <Route path="/" element={user ? <Navigate to={getDashboardRedirect()} replace /> : <LandingPage />} />
        <Route path="/auth" element={user ? <Navigate to={getDashboardRedirect()} replace /> : <Auth />} />
        
        {/* Author Portal Routes */}
        <Route path="/author" element={user ? <AuthorLayout /> : <Navigate to="/auth" replace />}>
          <Route index element={<Navigate to="/author/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="articles" element={<MyArticles />} />
          <Route path="submit" element={<SubmitArticle />} />
          <Route path="drafts" element={<Drafts />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* Admin Portal Routes */}
        <Route path="/admin-dashboard" element={user ? <AdminLayout /> : <Navigate to="/auth" replace />}>
          <Route index element={<AdminDashboard />} />
          <Route path="authors" element={<AdminAuthors />} />
          <Route path="articles" element={<AdminArticles />} />
        </Route>

        {/* Reviewer Portal Routes */}
        <Route path="/reviewer-dashboard" element={user ? <ReviewerLayout /> : <Navigate to="/auth" replace />}>
          <Route index element={<ReviewerDashboard />} />
          <Route path="articles" element={<ReviewerArticles />} />
          <Route path="notifications" element={<ReviewerNotifications />} />
        </Route>

        {/* Developer Portal Routes */}
        <Route path="/developer-dashboard" element={user ? <DeveloperLayout /> : <Navigate to="/auth" replace />}>
          <Route index element={<DeveloperDashboard />} />
          <Route path="issues" element={<DeveloperIssues />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App;

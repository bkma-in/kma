import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { getDashboardByRole } from './utils/auth';
import { Loader2 } from 'lucide-react';
import Auth from './pages/Auth';
import LandingPage from './pages/LandingPage';
import ToastContainer from './components/notifications/ToastContainer';
import ConfirmModal from './components/notifications/ConfirmModal';
import AuthorLayout from './layouts/AuthorLayout';
import Dashboard from './pages/author/Dashboard';
import MyArticles from './pages/author/MyArticles';
import SubmitArticle from './pages/author/SubmitArticle';
import Notifications from './pages/author/Notifications';
import Drafts from './pages/author/Drafts';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAuthors from './pages/admin/AdminAuthors';
import AdminArticles from './pages/admin/AdminArticles';
import ReviewerLayout from './layouts/ReviewerLayout';
import ReviewerDashboard from './pages/reviewer/ReviewerDashboard';
import ReviewerArticles from './pages/reviewer/ReviewerArticles';
import ReviewerNotifications from './pages/reviewer/ReviewerNotifications';
import DeveloperLayout from './layouts/DeveloperLayout';
import DeveloperDashboard from './pages/developer/DeveloperDashboard';
import DeveloperIssues from './pages/developer/DeveloperIssues';
import AcceptInvitation from './pages/AcceptInvitation';
import ProtectedRoute from './components/ProtectedRoute';
import { ReaderPlaceholder, DevPlaceholder } from './pages/PlaceholderPages';

function App() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-zinc-300" size={48} />
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Initializing KMA Portal</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen">
      <ToastContainer />
      <ConfirmModal />
      <Routes>
        <Route path="/" element={currentUser ? <Navigate to={getDashboardByRole(currentUser.role)} replace /> : <LandingPage />} />
        <Route path="/auth" element={currentUser ? <Navigate to={getDashboardByRole(currentUser.role)} replace /> : <Auth />} />
        <Route path="/invitation/accept/:token" element={<AcceptInvitation />} />
        
        {/* Author Portal Routes */}
        <Route path="/author/*" element={
          <ProtectedRoute allowedRoles={['author']}>
            <AuthorRoutes />
          </ProtectedRoute>
        } />

        {/* Admin Portal Routes */}
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminRoutes />
          </ProtectedRoute>
        } />

        {/* Reviewer Portal Routes */}
        <Route path="/reviewer/*" element={
          <ProtectedRoute allowedRoles={['reviewer']}>
            <ReviewerRoutes />
          </ProtectedRoute>
        } />

        {/* Reader Portal Routes */}
        <Route path="/reader/*" element={
          <ProtectedRoute allowedRoles={['reader']}>
            <ReaderRoutes />
          </ProtectedRoute>
        } />

        {/* Developer Portal Routes */}
        <Route path="/dev/*" element={
          <ProtectedRoute allowedRoles={['dev']}>
            <DeveloperRoutes />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

// Sub-route components for cleaner structure
function AuthorRoutes() {
  return (
    <Routes>
      <Route element={<AuthorLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="articles" element={<MyArticles />} />
        <Route path="submit" element={<SubmitArticle />} />
        <Route path="drafts" element={<Drafts />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
    </Routes>
  );
}

function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="authors" element={<AdminAuthors />} />
        <Route path="articles" element={<AdminArticles />} />
      </Route>
    </Routes>
  );
}

function ReviewerRoutes() {
  return (
    <Routes>
      <Route element={<ReviewerLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ReviewerDashboard />} />
        <Route path="articles" element={<ReviewerArticles />} />
        <Route path="notifications" element={<ReviewerNotifications />} />
      </Route>
    </Routes>
  );
}

function ReaderRoutes() {
  return (
    <Routes>
      <Route path="dashboard" element={<ReaderPlaceholder />} />
      <Route index element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}

function DeveloperRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route element={<DeveloperLayout />}>
        <Route path="dashboard" element={<DeveloperDashboard />} />
        <Route path="issues" element={<DeveloperIssues />} />
      </Route>
    </Routes>
  );
}

export default App;

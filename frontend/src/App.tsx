import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import type { ComponentType } from 'react';
import { useAuth } from './context/AuthContext';
import { getDashboardByRole } from './utils/auth';
import { Loader2, AlertTriangle, RefreshCw, Home } from 'lucide-react';
import ToastContainer from './components/notifications/ToastContainer';
import ConfirmModal from './components/notifications/ConfirmModal';
import AuthorLayout from './layouts/AuthorLayout';
import AdminLayout from './layouts/AdminLayout';
import ReviewerLayout from './layouts/ReviewerLayout';
import DeveloperLayout from './layouts/DeveloperLayout';
import ProtectedRoute from './components/ProtectedRoute';
import SessionOverlay from './components/SessionOverlay';

// Reader Portal Imports
import ReaderLayout from './layouts/ReaderLayout';

// Lazy-loaded pages
const Auth = lazy(() => import('./pages/Auth'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const AcceptInvitation = lazy(() => import('./pages/AcceptInvitation'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const ServiceDescription = lazy(() => import('./pages/ServiceDescription'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Copyright = lazy(() => import('./pages/Copyright'));
const ContactUs = lazy(() => import('./pages/ContactUs'));

// Author pages
const Dashboard = lazy(() => import('./pages/author/Dashboard'));
const MyArticles = lazy(() => import('./pages/author/MyArticles'));
const SubmitArticle = lazy(() => import('./pages/author/SubmitArticle'));
const Notifications = lazy(() => import('./pages/author/Notifications'));
const Drafts = lazy(() => import('./pages/author/Drafts'));
const AuthorRevisionRequired = lazy(() => import('./pages/author/AuthorRevisionRequired'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminAuthors = lazy(() => import('./pages/admin/AdminAuthors'));
const AdminAuthorsList = lazy(() => import('./pages/admin/AdminAuthorsList'));
const AdminArticles = lazy(() => import('./pages/admin/AdminArticles'));
const AdminReadyToPublish = lazy(() => import('./pages/admin/AdminReadyToPublish'));
const AdminReadersList = lazy(() => import('./pages/admin/AdminReadersList'));
const AdminPublishedArticles = lazy(() => import('./pages/admin/AdminPublishedArticles'));

// Reviewer pages
const ReviewerDashboard = lazy(() => import('./pages/reviewer/ReviewerDashboard'));
const ReviewerArticles = lazy(() => import('./pages/reviewer/ReviewerArticles'));
const ReviewerNotifications = lazy(() => import('./pages/reviewer/ReviewerNotifications'));

// Reader pages
const ReaderDashboard = lazy(() => import('./pages/reader/ReaderDashboard'));
const ReaderProfile = lazy(() => import('./pages/reader/ReaderProfile'));
const ReaderPayments = lazy(() => import('./pages/reader/ReaderPayments'));
const ReaderNotifications = lazy(() => import('./pages/reader/ReaderNotifications'));
const ReaderSavedArticles = lazy(() => import('./pages/reader/ReaderSavedArticles'));
const GetSubscription = lazy(() => import('./pages/reader/GetSubscription'));

// Developer pages
const DeveloperDashboard = lazy(() => import('./pages/developer/DeveloperDashboard'));
const DeveloperIssues = lazy(() => import('./pages/developer/DeveloperIssues'));
const DeveloperNotifications = lazy(() => import('./pages/developer/DeveloperNotifications'));

import PageSkeletonFallback from './components/skeletons/PageSkeletonFallback';

// Dynamic route boundary skeleton wrapper
const lazyRoute = (Component: ComponentType<any>) => (
  <Suspense fallback={<PageSkeletonFallback />}>
    <Component />
  </Suspense>
);

function ScrollToTop() {
  const { pathname, key } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, key]);

  return null;
}

function App() {
  const { currentUser, loading, roleLoading, roleError, refreshRole, logout } = useAuth();
  const navigate = useNavigate();

  const dashboardPath = currentUser ? getDashboardByRole(currentUser.role) : '';
  const hasValidDashboard = !!currentUser && !dashboardPath.startsWith('/auth');

  // Initial auth & role verification skeleton loading check
  if (loading || roleLoading) {
    const path = window.location.pathname;
    const userRole = currentUser?.role || (localStorage.getItem('role') as any) || (localStorage.getItem('__kma_cached_role') as any);

    if (path.startsWith('/admin') || userRole === 'admin') {
      return <AdminLayout isLoadingSkeleton={true} />;
    }
    if (path.startsWith('/author') || userRole === 'author') {
      return <AuthorLayout isLoadingSkeleton={true} />;
    }
    if (path.startsWith('/reviewer') || userRole === 'reviewer') {
      return <ReviewerLayout isLoadingSkeleton={true} />;
    }
    if (path.startsWith('/reader') || userRole === 'reader') {
      return <ReaderLayout isLoadingSkeleton={true} />;
    }
    if (path.startsWith('/dev') || userRole === 'dev' || userRole === 'developer') {
      return <DeveloperLayout isLoadingSkeleton={true} />;
    }
    return <PageSkeletonFallback />;
  }

  if (roleError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center border border-zinc-100">
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="text-rose-500" size={32} />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 mb-2">Access Verification Failed</h3>
          <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
            We couldn't verify your account credentials or system access role. This might be due to a temporary network issue.
          </p>
          <div className="space-y-3">
            <button
              onClick={refreshRole}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-black text-white text-sm font-black rounded-xl hover:bg-zinc-800 transition-all shadow-xl shadow-black/10 cursor-pointer"
            >
              <RefreshCw size={16} />
              Retry Verification
            </button>
            <button
              onClick={async () => {
                try {
                  await logout();
                  localStorage.clear();
                  sessionStorage.clear();
                } catch (err) {
                  console.error('[AUTH-DIAGNOSTIC] Logout failed:', err);
                }
                navigate('/', { replace: true });
              }}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-zinc-100 text-zinc-700 text-sm font-bold rounded-xl hover:bg-zinc-200 transition-all cursor-pointer"
            >
              <Home size={16} />
              Return Home
            </button>
          </div>
          <p className="text-[10px] text-zinc-400 mt-6 uppercase tracking-wider font-bold">
            BKMA Portal • Access Security
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen">
      <ScrollToTop />
      <SessionOverlay />
      <ToastContainer />
      <ConfirmModal />
      <Routes>
          <Route path="/" element={lazyRoute(LandingPage)} />
          <Route path="/about-us" element={lazyRoute(AboutUs)} />
          <Route path="/refund-policy" element={lazyRoute(RefundPolicy)} />
          <Route path="/refund-cancellation-policy" element={<Navigate to="/refund-policy" replace />} />
          <Route path="/privacy-policy" element={lazyRoute(PrivacyPolicy)} />
          <Route path="/privacy policy" element={<Navigate to="/privacy-policy" replace />} />
          <Route path="/copyright" element={lazyRoute(Copyright)} />
          <Route path="/copyright-policy" element={<Navigate to="/copyright" replace />} />
          <Route path="/copyright policy" element={<Navigate to="/copyright" replace />} />
          <Route path="/terms-and-conditions" element={lazyRoute(TermsAndConditions)} />
          <Route path="/terms" element={<Navigate to="/terms-and-conditions" replace />} />
          <Route path="/pricing" element={lazyRoute(PricingPage)} />
          <Route path="/service-description" element={lazyRoute(ServiceDescription)} />
          <Route path="/contact-us" element={lazyRoute(ContactUs)} />
          <Route path="/contact" element={<Navigate to="/contact-us" replace />} />
          <Route path="/contact us" element={<Navigate to="/contact-us" replace />} />
          <Route path="/auth" element={hasValidDashboard ? <Navigate to={dashboardPath} replace /> : lazyRoute(Auth)} />
          <Route path="/login" element={hasValidDashboard ? <Navigate to={dashboardPath} replace /> : <Navigate to="/auth?mode=login" replace />} />
          <Route path="/signin" element={hasValidDashboard ? <Navigate to={dashboardPath} replace /> : <Navigate to="/auth?mode=login" replace />} />
          <Route path="/register" element={hasValidDashboard ? <Navigate to={dashboardPath} replace /> : <Navigate to="/auth?mode=register" replace />} />
          <Route path="/invitation/accept/:token" element={lazyRoute(AcceptInvitation)} />
          
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
        <Route path="dashboard" element={lazyRoute(Dashboard)} />
        <Route path="articles" element={lazyRoute(MyArticles)} />
        <Route path="submit" element={lazyRoute(SubmitArticle)} />
        <Route path="drafts" element={lazyRoute(Drafts)} />
        <Route path="revision-required" element={lazyRoute(AuthorRevisionRequired)} />
        <Route path="notifications" element={lazyRoute(Notifications)} />
      </Route>
    </Routes>
  );
}

function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={lazyRoute(AdminDashboard)} />
        <Route path="reviewers" element={lazyRoute(AdminAuthors)} />
        <Route path="authors-list" element={lazyRoute(AdminAuthorsList)} />
        <Route path="readers" element={lazyRoute(AdminReadersList)} />
        <Route path="articles" element={lazyRoute(AdminArticles)} />
        <Route path="ready-to-publish" element={lazyRoute(AdminReadyToPublish)} />
        <Route path="published-articles" element={lazyRoute(AdminPublishedArticles)} />
        <Route path="notifications" element={lazyRoute(Notifications)} />
      </Route>
    </Routes>
  );
}

function ReviewerRoutes() {
  return (
    <Routes>
      <Route element={<ReviewerLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={lazyRoute(ReviewerDashboard)} />
        <Route path="articles" element={lazyRoute(ReviewerArticles)} />
        <Route path="notifications" element={lazyRoute(ReviewerNotifications)} />
      </Route>
    </Routes>
  );
}

function ReaderRoutes() {
  return (
    <Routes>
      <Route element={<ReaderLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={lazyRoute(ReaderDashboard)} />
        <Route path="payments" element={lazyRoute(ReaderPayments)} />
        <Route path="notifications" element={lazyRoute(ReaderNotifications)} />
        <Route path="saved" element={lazyRoute(ReaderSavedArticles)} />
        <Route path="profile" element={lazyRoute(ReaderProfile)} />
        <Route path="get-subscription" element={lazyRoute(GetSubscription)} />
      </Route>
    </Routes>
  );
}

function DeveloperRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route element={<DeveloperLayout />}>
        <Route path="dashboard" element={lazyRoute(DeveloperDashboard)} />
        <Route path="issues" element={lazyRoute(DeveloperIssues)} />
        <Route path="notifications" element={lazyRoute(DeveloperNotifications)} />
      </Route>
    </Routes>
  );
}

export default App;


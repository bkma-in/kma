import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { getDashboardByRole } from './utils/auth';
import { Loader2, AlertTriangle, RefreshCw, Home } from 'lucide-react';
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
import AuthorRevisionRequired from './pages/author/AuthorRevisionRequired';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAuthors from './pages/admin/AdminAuthors';
import AdminAuthorsList from './pages/admin/AdminAuthorsList';
import AdminArticles from './pages/admin/AdminArticles';
import AdminReadyToPublish from './pages/admin/AdminReadyToPublish';
import AdminReadersList from './pages/admin/AdminReadersList';
import AdminIngestArchive from './pages/admin/AdminIngestArchive';
import ArchiveManagement from './pages/admin/ArchiveManagement';
import ArchiveReview from './pages/admin/ArchiveReview';
import ReviewerLayout from './layouts/ReviewerLayout';
import ReviewerDashboard from './pages/reviewer/ReviewerDashboard';
import ReviewerArticles from './pages/reviewer/ReviewerArticles';
import ReviewerNotifications from './pages/reviewer/ReviewerNotifications';
import DeveloperLayout from './layouts/DeveloperLayout';
import DeveloperDashboard from './pages/developer/DeveloperDashboard';
import DeveloperIssues from './pages/developer/DeveloperIssues';
import DeveloperNotifications from './pages/developer/DeveloperNotifications';
import AcceptInvitation from './pages/AcceptInvitation';
import ProtectedRoute from './components/ProtectedRoute';
import SessionOverlay from './components/SessionOverlay';
import AboutUs from './pages/AboutUs';
import RefundPolicy from './pages/RefundPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import PricingPage from './pages/PricingPage';
import ServiceDescription from './pages/ServiceDescription';

import PrivacyPolicy from './pages/PrivacyPolicy';
import Copyright from './pages/Copyright';
import ContactUs from './pages/ContactUs';

// Reader Portal Imports
import ReaderLayout from './layouts/ReaderLayout';
import ReaderDashboard from './pages/reader/ReaderDashboard';
import ReaderProfile from './pages/reader/ReaderProfile';
import ReaderPayments from './pages/reader/ReaderPayments';
import ReaderNotifications from './pages/reader/ReaderNotifications';
import ReaderSavedArticles from './pages/reader/ReaderSavedArticles';
import GetSubscription from './pages/reader/GetSubscription';

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

  // Firebase initial initialization check
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-zinc-300" size={48} />
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">
            Initializing BKMA Portal
          </p>
        </div>
      </div>
    );
  }

  // Dashboard skeleton layout loading check (bypass for auth paths to avoid component unmounting/flicker)
  if (roleLoading) {
    const path = window.location.pathname;
    if (path.startsWith('/admin')) {
      return <AdminLayout isLoadingSkeleton={true} />;
    }
    if (path.startsWith('/author')) {
      return <AuthorLayout isLoadingSkeleton={true} />;
    }
    if (path.startsWith('/reviewer')) {
      return <ReviewerLayout isLoadingSkeleton={true} />;
    }
    if (path.startsWith('/reader')) {
      return <ReaderLayout isLoadingSkeleton={true} />;
    }
    if (path.startsWith('/dev')) {
      return <DeveloperLayout isLoadingSkeleton={true} />;
    }
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
          <Route path="/" element={<LandingPage />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/refund-cancellation-policy" element={<Navigate to="/refund-policy" replace />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/privacy policy" element={<Navigate to="/privacy-policy" replace />} />
          <Route path="/copyright" element={<Copyright />} />
          <Route path="/copyright-policy" element={<Navigate to="/copyright" replace />} />
          <Route path="/copyright policy" element={<Navigate to="/copyright" replace />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/terms" element={<Navigate to="/terms-and-conditions" replace />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/service-description" element={<ServiceDescription />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/contact" element={<Navigate to="/contact-us" replace />} />
          <Route path="/contact us" element={<Navigate to="/contact-us" replace />} />
          <Route path="/auth" element={hasValidDashboard ? <Navigate to={dashboardPath} replace /> : <Auth />} />
          <Route path="/login" element={hasValidDashboard ? <Navigate to={dashboardPath} replace /> : <Navigate to="/auth?mode=login" replace />} />
          <Route path="/signin" element={hasValidDashboard ? <Navigate to={dashboardPath} replace /> : <Navigate to="/auth?mode=login" replace />} />
          <Route path="/register" element={hasValidDashboard ? <Navigate to={dashboardPath} replace /> : <Navigate to="/auth?mode=register" replace />} />
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
        <Route path="revision-required" element={<AuthorRevisionRequired />} />
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
        <Route path="reviewers" element={<AdminAuthors />} />
        <Route path="authors-list" element={<AdminAuthorsList />} />
        <Route path="readers" element={<AdminReadersList />} />
        <Route path="articles" element={<AdminArticles />} />
        <Route path="ready-to-publish" element={<AdminReadyToPublish />} />
        <Route path="ingest-archive" element={<Navigate to="../archive-management" replace />} />
        <Route path="archive-management" element={<ArchiveManagement />} />
        <Route path="archive-review/:jobId" element={<ArchiveReview />} />
        <Route path="notifications" element={<Notifications />} />
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
      <Route element={<ReaderLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ReaderDashboard />} />
        <Route path="payments" element={<ReaderPayments />} />
        <Route path="notifications" element={<ReaderNotifications />} />
        <Route path="saved" element={<ReaderSavedArticles />} />
        <Route path="profile" element={<ReaderProfile />} />
        <Route path="get-subscription" element={<GetSubscription />} />
      </Route>
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
        <Route path="notifications" element={<DeveloperNotifications />} />
      </Route>
    </Routes>
  );
}

export default App;

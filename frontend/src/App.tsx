import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAuthors from './pages/admin/AdminAuthors';
import AdminAuthorsList from './pages/admin/AdminAuthorsList';
import AdminArticles from './pages/admin/AdminArticles';
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

// Reader Portal Imports
import ReaderLayout from './layouts/ReaderLayout';
import ReaderDashboard from './pages/reader/ReaderDashboard';
import ReaderProfile from './pages/reader/ReaderProfile';
import ReaderPayments from './pages/reader/ReaderPayments';
import ReaderNotifications from './pages/reader/ReaderNotifications';
import ReaderSavedArticles from './pages/reader/ReaderSavedArticles';
import GetSubscription from './pages/reader/GetSubscription';

function App() {
  const { currentUser, loading, roleLoading, roleError, refreshRole, logout } = useAuth();
  const navigate = useNavigate();

  if (loading || roleLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-zinc-300" size={48} />
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">
            {loading ? 'Initializing BKMA Portal' : 'Verifying Access'}
          </p>
        </div>
      </div>
    );
  }

  if (roleError) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center border border-zinc-100">
          <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="text-rose-500" size={32} />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mb-2 font-['Outfit']">
            Access Verification Failed
          </h2>
          <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
            {roleError}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                console.log('[AUTH-DIAGNOSTIC] Retry verification clicked');
                refreshRole();
              }}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-black text-white text-sm font-bold rounded-xl hover:bg-zinc-800 transition-all shadow-md cursor-pointer"
            >
              <RefreshCw size={16} />
              Retry Verification
            </button>
            <button
              onClick={async () => {
                console.log('[AUTH-DIAGNOSTIC] Return home clicked. Performing logout and redirecting to landing page.');
                try {
                  await logout();
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
      <SessionOverlay />
      <ToastContainer />
      <ConfirmModal />
      <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={currentUser ? <Navigate to={getDashboardByRole(currentUser.role)} replace /> : <Auth />} />
          <Route path="/login" element={currentUser ? <Navigate to={getDashboardByRole(currentUser.role)} replace /> : <Navigate to="/auth?mode=login" replace />} />
          <Route path="/signin" element={currentUser ? <Navigate to={getDashboardByRole(currentUser.role)} replace /> : <Navigate to="/auth?mode=login" replace />} />
          <Route path="/register" element={currentUser ? <Navigate to={getDashboardByRole(currentUser.role)} replace /> : <Navigate to="/auth?mode=register" replace />} />
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
        <Route path="reviewers" element={<AdminAuthors />} />
        <Route path="authors-list" element={<AdminAuthorsList />} />
        <Route path="articles" element={<AdminArticles />} />
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

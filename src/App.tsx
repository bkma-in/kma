import { Routes, Route, Navigate } from 'react-router-dom';
import AuthContainer from './components/AuthContainer'
import LandingPage from './components/LandingPage'
import AuthorLayout from './pages/author/AuthorLayout'
import Dashboard from './pages/author/Dashboard'
import MyArticles from './pages/author/MyArticles'
import SubmitArticle from './pages/author/SubmitArticle'
import Notifications from './pages/author/Notifications'
import Drafts from './pages/author/Drafts'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminAuthors from './pages/admin/AdminAuthors'
import AdminArticles from './pages/admin/AdminArticles'
import ReviewerLayout from './pages/reviewer/ReviewerLayout'
import ReviewerDashboard from './pages/reviewer/ReviewerDashboard'
import ReviewerArticles from './pages/reviewer/ReviewerArticles'
import ReviewerNotifications from './pages/reviewer/ReviewerNotifications'

function App() {
  return (
    <div className="w-full min-h-screen">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthContainer />} />
        
        {/* Author Portal Routes */}
        <Route path="/author" element={<AuthorLayout />}>
          <Route index element={<Navigate to="/author/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="articles" element={<MyArticles />} />
          <Route path="submit" element={<SubmitArticle />} />
          <Route path="drafts" element={<Drafts />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* Admin Portal Routes */}
        <Route path="/admin-dashboard" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="authors" element={<AdminAuthors />} />
          <Route path="articles" element={<AdminArticles />} />
        </Route>

        {/* Reviewer Portal Routes */}
        <Route path="/reviewer-dashboard" element={<ReviewerLayout />}>
          <Route index element={<ReviewerDashboard />} />
          <Route path="articles" element={<ReviewerArticles />} />
          <Route path="notifications" element={<ReviewerNotifications />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App

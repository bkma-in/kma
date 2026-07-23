import React from 'react';
import PublicHeader from '../PublicHeader';
import AdminLayout from '../../layouts/AdminLayout';
import AuthorLayout from '../../layouts/AuthorLayout';
import ReviewerLayout from '../../layouts/ReviewerLayout';
import ReaderLayout from '../../layouts/ReaderLayout';
import DeveloperLayout from '../../layouts/DeveloperLayout';
import { 
  LandingPageSkeleton, 
  AdminDashboardSkeleton, 
  AuthorDashboardSkeleton, 
  ReviewerDashboardSkeleton, 
  ReaderDashboardSkeleton, 
  DeveloperDashboardSkeleton
} from './PageSkeletons';

export const PageSkeletonFallback: React.FC = () => {
  const path = window.location.pathname;
  const userRole = localStorage.getItem('role') || localStorage.getItem('__kma_cached_role');

  // Role-based Layout Skeletons ONLY for portal routes or /auth login transitions
  if (path.startsWith('/admin') || (path === '/auth' && userRole === 'admin')) {
    return <AdminLayout isLoadingSkeleton={true} />;
  }

  if (path.startsWith('/author') || (path === '/auth' && userRole === 'author')) {
    return <AuthorLayout isLoadingSkeleton={true} />;
  }

  if (path.startsWith('/reviewer') || (path === '/auth' && userRole === 'reviewer')) {
    return <ReviewerLayout isLoadingSkeleton={true} />;
  }

  if (path.startsWith('/reader') || (path === '/auth' && userRole === 'reader')) {
    return <ReaderLayout isLoadingSkeleton={true} />;
  }

  if (path.startsWith('/dev') || (path === '/auth' && (userRole === 'dev' || userRole === 'developer'))) {
    return <DeveloperLayout isLoadingSkeleton={true} />;
  }

  // For public routes (like '/' landing page, '/about-us', etc.), ALWAYS return LandingPageSkeleton
  return <LandingPageSkeleton />;
};

export default PageSkeletonFallback;

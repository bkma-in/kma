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
  DeveloperDashboardSkeleton,
  ArticlesSkeleton,
  NotificationsSkeleton
} from './PageSkeletons';

export const PageSkeletonFallback: React.FC = () => {
  const path = window.location.pathname;
  const userRole = localStorage.getItem('role') || localStorage.getItem('__kma_cached_role');

  // Role-based Layout Skeletons for portals & auth transitions
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

  // Check if it's a public marketing page route
  const isPublicRoute = 
    path === '/' || 
    path === '/about-us' || 
    path === '/pricing' || 
    path === '/contact-us' || 
    path === '/contact' ||
    path === '/refund-policy' || 
    path === '/privacy-policy' || 
    path === '/terms-and-conditions' || 
    path === '/copyright' || 
    path === '/service-description';

  if (isPublicRoute) {
    return <LandingPageSkeleton />;
  }

  // Fallback for /auth or in-flight auth verification:
  // Render AdminLayout skeleton instead of LandingPageSkeleton!
  return <AdminLayout isLoadingSkeleton={true} />;
};

export default PageSkeletonFallback;

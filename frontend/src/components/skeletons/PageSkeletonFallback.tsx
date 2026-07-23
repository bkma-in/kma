import React from 'react';
import PublicHeader from '../PublicHeader';
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

  // Check if it's a public/landing page route
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

  if (path.startsWith('/admin')) {
    return (
      <div className="min-h-screen bg-zinc-50 font-['Outfit']">
        <PublicHeader />
        <main className="pt-28 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in">
          {path.includes('/dashboard') ? <AdminDashboardSkeleton /> : path.includes('/notifications') ? <NotificationsSkeleton /> : <ArticlesSkeleton />}
        </main>
      </div>
    );
  }

  if (path.startsWith('/author')) {
    return (
      <div className="min-h-screen bg-zinc-50 font-['Outfit']">
        <PublicHeader />
        <main className="pt-28 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in">
          {path.includes('/dashboard') ? <AuthorDashboardSkeleton /> : path.includes('/notifications') ? <NotificationsSkeleton /> : <ArticlesSkeleton />}
        </main>
      </div>
    );
  }

  if (path.startsWith('/reviewer')) {
    return (
      <div className="min-h-screen bg-zinc-50 font-['Outfit']">
        <PublicHeader />
        <main className="pt-28 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in">
          {path.includes('/dashboard') ? <ReviewerDashboardSkeleton /> : path.includes('/notifications') ? <NotificationsSkeleton /> : <ArticlesSkeleton />}
        </main>
      </div>
    );
  }

  if (path.startsWith('/reader')) {
    return (
      <div className="min-h-screen bg-zinc-50 font-['Outfit']">
        <PublicHeader />
        <main className="pt-28 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in">
          {path.includes('/dashboard') ? <ReaderDashboardSkeleton /> : path.includes('/notifications') ? <NotificationsSkeleton /> : <ArticlesSkeleton />}
        </main>
      </div>
    );
  }

  if (path.startsWith('/dev')) {
    return (
      <div className="min-h-screen bg-zinc-50 font-['Outfit']">
        <PublicHeader />
        <main className="pt-28 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in">
          <DeveloperDashboardSkeleton />
        </main>
      </div>
    );
  }

  return <LandingPageSkeleton />;
};

export default PageSkeletonFallback;

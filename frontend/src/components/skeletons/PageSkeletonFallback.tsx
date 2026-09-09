import React from 'react';
import { 
  LandingPageSkeleton, 
  AdminDashboardSkeleton, 
  AuthorDashboardSkeleton, 
  ReviewerDashboardSkeleton, 
  ReaderDashboardSkeleton, 
  DeveloperDashboardSkeleton,
  AdminPublishedArticlesSkeleton,
  AdminReadersListSkeleton,
  AdminLifeMembersSkeleton,
  AdminPaymentsSkeleton,
  AdminCallForPapersSkeleton,
  AuthorRevisionRequiredSkeleton,
  DeveloperIssuesSkeleton,
  ReaderPaymentsSkeleton,
  NotificationsSkeleton,
  SkeletonAuth,
  SkeletonSimpleDoc,
  SkeletonCFPCard,
  SkeletonCFPDetails,
  SkeletonWorkflowCard,
  SkeletonReviewerArticle
} from './PageSkeletons';
import { SkeletonProfile } from './SkeletonProfile';
import { SkeletonAcceptInvitation } from './SkeletonAcceptInvitation';
import PublicHeader from '../PublicHeader';
import PublicFooter from '../PublicFooter';

export const PageSkeletonFallback: React.FC = () => {
  const path = window.location.pathname;

  // 1. Admin Portal routes (page content skeletons only, NO duplicate AdminLayout!)
  if (path.startsWith('/admin')) {
    if (path.includes('/dashboard') || path === '/admin') return <AdminDashboardSkeleton />;
    if (path.includes('/published')) return <AdminPublishedArticlesSkeleton />;
    if (path.includes('/ready-to-publish')) return <AdminPublishedArticlesSkeleton />;
    if (path.includes('/articles')) return <div className="space-y-6 max-w-7xl mx-auto"><SkeletonWorkflowCard count={3} /></div>;
    if (path.includes('/call-for-papers') || path.includes('/cfp')) return <AdminCallForPapersSkeleton />;
    if (path.includes('/payments')) return <AdminPaymentsSkeleton />;
    if (path.includes('/readers')) return <AdminReadersListSkeleton />;
    if (path.includes('/life-members')) return <AdminLifeMembersSkeleton />;
    if (path.includes('/authors') || path.includes('/reviewers')) return <AdminReadersListSkeleton />;
    if (path.includes('/notifications')) return <NotificationsSkeleton />;
    if (path.includes('/profile')) return <SkeletonProfile />;
    return <AdminDashboardSkeleton />;
  }

  // 2. Author Portal routes
  if (path.startsWith('/author')) {
    if (path.includes('/dashboard') || path === '/author') return <AuthorDashboardSkeleton />;
    if (path.includes('/articles')) return <div className="space-y-6 max-w-7xl mx-auto"><SkeletonWorkflowCard count={3} /></div>;
    if (path.includes('/drafts')) return <div className="space-y-6 max-w-7xl mx-auto"><SkeletonWorkflowCard count={3} /></div>;
    if (path.includes('/revision')) return <AuthorRevisionRequiredSkeleton />;
    if (path.includes('/notifications')) return <NotificationsSkeleton />;
    if (path.includes('/profile')) return <SkeletonProfile />;
    if (path.includes('/submit')) return <AuthorDashboardSkeleton />;
    return <AuthorDashboardSkeleton />;
  }

  // 3. Reviewer Portal routes
  if (path.startsWith('/reviewer')) {
    if (path.includes('/dashboard') || path === '/reviewer') return <ReviewerDashboardSkeleton />;
    if (path.includes('/articles')) return <div className="space-y-6 max-w-7xl mx-auto"><SkeletonReviewerArticle count={2} /></div>;
    if (path.includes('/notifications')) return <NotificationsSkeleton />;
    if (path.includes('/profile')) return <SkeletonProfile />;
    return <ReviewerDashboardSkeleton />;
  }

  // 4. Reader Portal routes
  if (path.startsWith('/reader')) {
    if (path.includes('/dashboard') || path === '/reader') return <ReaderDashboardSkeleton />;
    if (path.includes('/payments')) return <ReaderPaymentsSkeleton />;
    if (path.includes('/notifications')) return <NotificationsSkeleton />;
    if (path.includes('/profile')) return <SkeletonProfile />;
    if (path.includes('/saved')) return <ReaderDashboardSkeleton />;
    if (path.includes('/subscription') || path.includes('/get-subscription')) return <ReaderPaymentsSkeleton />;
    return <ReaderDashboardSkeleton />;
  }

  // 5. Developer Portal routes
  if (path.startsWith('/dev')) {
    if (path.includes('/dashboard') || path === '/dev') return <DeveloperDashboardSkeleton />;
    if (path.includes('/issues')) return <DeveloperIssuesSkeleton />;
    if (path.includes('/notifications')) return <NotificationsSkeleton />;
    if (path.includes('/profile')) return <SkeletonProfile />;
    return <DeveloperDashboardSkeleton />;
  }

  // 6. Public / Authentication routes
  if (path === '/auth' || path === '/login' || path === '/signin' || path === '/register') {
    return <SkeletonAuth />;
  }

  if (path.startsWith('/invitation/accept')) {
    return <SkeletonAcceptInvitation />;
  }

  if (path.startsWith('/call-for-papers/') && path !== '/call-for-papers') {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col font-['Outfit']">
        <PublicHeader />
        <main className="flex-1 pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto w-full">
          <SkeletonCFPDetails />
        </main>
        <PublicFooter />
      </div>
    );
  }

  if (path === '/call-for-papers' || path === '/cfp') {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col font-['Outfit']">
        <PublicHeader />
        <main className="flex-1 pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto w-full space-y-8">
          <div className="space-y-4 text-center max-w-2xl mx-auto">
            <div className="h-10 skeleton-box rounded-xl w-3/4 mx-auto" />
            <div className="h-4 skeleton-box rounded-md w-full mx-auto" />
          </div>
          <SkeletonCFPCard count={4} />
        </main>
        <PublicFooter />
      </div>
    );
  }

  // 7. Informational / Policy public routes
  if (
    path.startsWith('/about') || 
    path.startsWith('/privacy') || 
    path.startsWith('/terms') || 
    path.startsWith('/refund') || 
    path.startsWith('/copyright') || 
    path.startsWith('/service') || 
    path.startsWith('/contact') || 
    path.startsWith('/author-guidelines') || 
    path.startsWith('/reviewer-guidelines') || 
    path.startsWith('/pricing')
  ) {
    return <SkeletonSimpleDoc />;
  }

  // 8. Default for Landing page
  return <LandingPageSkeleton />;
};

export default PageSkeletonFallback;

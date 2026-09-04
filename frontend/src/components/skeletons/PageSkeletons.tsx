import React from 'react';
import PublicHeader from '../PublicHeader';
import PublicFooter from '../PublicFooter';
import { SkeletonStatistics } from './SkeletonStatistics';
import { SkeletonArticleCard } from './SkeletonArticleCard';
import { SkeletonTable } from './SkeletonTable';
import { SkeletonNotification } from './SkeletonNotification';
import { SkeletonProfile } from './SkeletonProfile';
import { SkeletonWorkflowCard } from './SkeletonWorkflowCard';
import { SkeletonReviewerArticle } from './SkeletonReviewerArticle';
import { SkeletonCFPCard } from './SkeletonCFPCard';
import { SkeletonCFPDetails } from './SkeletonCFPDetails';
import { SkeletonAuth } from './SkeletonAuth';
import { SkeletonSimpleDoc } from './SkeletonSimpleDoc';
import { CardSkeleton, SkeletonBox, AvatarSkeleton } from './SkeletonBase';

export { SkeletonAuth, SkeletonSimpleDoc, SkeletonCFPCard, SkeletonCFPDetails, SkeletonWorkflowCard, SkeletonReviewerArticle };

export const HeroSkeleton: React.FC = () => {
  return (
    <section className="bg-black text-white w-full overflow-hidden min-h-[85vh] flex items-center pt-24 pb-20 sm:pt-32 sm:pb-32">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-10 lg:gap-16">
          {/* Left Column (Hero Intro + Reviewer Notice) */}
          <div className="flex flex-col text-left space-y-4">
            <SkeletonBox dark className="h-10 sm:h-14 rounded-lg w-3/4" />
            <SkeletonBox dark className="h-10 sm:h-14 rounded-lg w-1/2" />
            <div className="space-y-2 mt-4 max-w-lg">
              <SkeletonBox dark className="h-4 rounded-md w-full" />
              <SkeletonBox dark className="h-4 rounded-md w-5/6" />
              <SkeletonBox dark className="h-4 rounded-md w-4/5" />
            </div>
            {/* Reviewer Notice Card Skeleton */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mt-6 sm:mt-10 w-full sm:max-w-md shadow-xl lg:w-fit">
              <div className="flex items-start gap-4">
                <SkeletonBox dark className="w-10 h-10 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <SkeletonBox dark className="h-4 rounded-md w-1/3" />
                  <SkeletonBox dark className="h-3.5 rounded-md w-full" />
                  <SkeletonBox dark className="h-3.5 rounded-md w-5/6" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Membership Benefits Card Skeleton */}
          <div className="w-full flex justify-center lg:justify-end">
            <div className="bg-white text-black rounded-2xl shadow-2xl p-8 sm:p-10 w-full max-w-md lg:max-w-lg space-y-6">
              <SkeletonBox className="h-8 rounded-lg w-2/3 pb-5 border-b border-zinc-100" />
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-5 items-start">
                    <SkeletonBox className="w-12 h-12 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <SkeletonBox className="h-5 rounded-md w-1/3" />
                      <SkeletonBox className="h-3.5 rounded-md w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export const TributesSkeleton: React.FC = () => {
  return (
    <section className="py-20 px-6 bg-white border-b border-zinc-200">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12 border-b-2 border-zinc-200 pb-6">
          <SkeletonBox className="h-10 rounded-lg w-48" />
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-purple-50/10 p-8 rounded-[2rem] border border-purple-100/50 flex flex-col">
              <div className="flex items-center gap-2 mb-5">
                <SkeletonBox className="h-4 rounded-full w-16" />
              </div>
              <div className="space-y-2 mb-4 min-h-[4rem]">
                <SkeletonBox className="h-5 rounded-md w-full" />
                <SkeletonBox className="h-5 rounded-md w-2/3" />
              </div>
              <div className="space-y-2 mb-8 flex-1">
                <SkeletonBox className="h-3.5 rounded-md w-full" />
                <SkeletonBox className="h-3.5 rounded-md w-full" />
                <SkeletonBox className="h-3.5 rounded-md w-4/5" />
              </div>
              <SkeletonBox className="w-full h-11 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const LandingPageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-black selection:bg-black selection:text-white animate-fade-in">
      <PublicHeader />
      <HeroSkeleton />
      <section className="py-20 px-6 bg-zinc-50 border-y border-zinc-200">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-zinc-200 pb-6 gap-6">
            <div className="space-y-2">
              <SkeletonBox className="h-3.5 w-36 rounded-md" />
              <SkeletonBox className="h-8 w-64 rounded-lg" />
            </div>
            <SkeletonBox className="h-10 w-full sm:w-80 rounded-xl" />
          </div>
          <SkeletonArticleCard count={6} />
        </div>
      </section>
      <TributesSkeleton />
      <PublicFooter />
    </div>
  );
};

export const AdminDashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-10 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <SkeletonBox className="h-9 w-64 rounded-xl" />
          <SkeletonBox className="h-4 w-96 rounded-lg" />
        </div>
        <SkeletonBox className="h-10 w-48 rounded-xl" />
      </div>

      {/* 5 Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl skeleton-box" />
            <div className="space-y-1.5">
              <SkeletonBox className="h-7 w-12 rounded" />
              <SkeletonBox className="h-3 w-24 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-zinc-100 p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <SkeletonBox className="h-5 rounded-md w-36" />
            <SkeletonBox className="h-4 rounded w-20" />
          </div>
          <div className="space-y-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4 items-start">
                <SkeletonBox className="w-10 h-10 rounded-xl shrink-0" />
                <div className="space-y-2 flex-1">
                  <SkeletonBox className="h-4 rounded w-1/3" />
                  <SkeletonBox className="h-3 rounded w-3/4" />
                </div>
                <SkeletonBox className="h-3 rounded w-16" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: System Status Card */}
        <div className="space-y-6">
          <CardSkeleton className="space-y-6">
            <SkeletonBox className="h-5 rounded-md w-40" />
            <div className="space-y-4">
              <SkeletonBox className="h-16 rounded-2xl w-full" />
              <SkeletonBox className="h-16 rounded-2xl w-full" />
            </div>
            <SkeletonBox className="h-11 rounded-xl w-full mt-4" />
          </CardSkeleton>
        </div>
      </div>
    </div>
  );
};

export const AuthorDashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <SkeletonBox className="h-9 w-64 rounded-xl" />
          <SkeletonBox className="h-4 w-96 rounded-lg" />
        </div>
        <SkeletonBox className="h-10 w-44 rounded-xl" />
      </div>

      {/* 6 Stats Cards matching actual grid-cols-2 md:grid-cols-3 lg:grid-cols-6 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <SkeletonBox className="w-10 h-10 rounded-xl" />
              <SkeletonBox className="w-4 h-4 rounded" />
            </div>
            <div className="space-y-1.5">
              <SkeletonBox className="h-8 w-12 rounded" />
              <SkeletonBox className="h-3 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* CFP Banner placeholder */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <SkeletonBox className="h-4 rounded w-36" />
          <SkeletonBox className="h-3.5 rounded w-24" />
        </div>
        <SkeletonBox className="h-14 rounded-xl w-full" />
      </div>

      {/* 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Quick Actions + Recent Activity */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Actions (3 buttons) */}
          <div className="space-y-3">
            <SkeletonBox className="h-3.5 rounded w-28" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SkeletonBox className="h-16 rounded-2xl w-full" />
              <SkeletonBox className="h-16 rounded-2xl w-full" />
              <SkeletonBox className="h-16 rounded-2xl w-full" />
            </div>
          </div>

          {/* Recent Activity Timeline */}
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <SkeletonBox className="h-4 rounded-md w-32" />
              <SkeletonBox className="h-3 rounded w-20" />
            </div>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 items-start">
                  <SkeletonBox className="w-12 h-12 rounded-2xl shrink-0" />
                  <div className="space-y-2 flex-1">
                    <SkeletonBox className="h-4 rounded w-1/3" />
                    <SkeletonBox className="h-3 rounded w-2/3" />
                  </div>
                  <SkeletonBox className="h-3 rounded w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Guidelines / Tips Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm space-y-5">
            <SkeletonBox className="h-5 rounded-md w-40" />
            <div className="space-y-3">
              <SkeletonBox className="h-3.5 rounded w-full" />
              <SkeletonBox className="h-3.5 rounded w-full" />
              <SkeletonBox className="h-3.5 rounded w-4/5" />
            </div>
            <SkeletonBox className="h-10 rounded-xl w-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const ReviewerDashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-10 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <SkeletonBox className="h-9 w-64 rounded-xl" />
          <SkeletonBox className="h-4 w-96 rounded-lg" />
        </div>
        <SkeletonBox className="h-10 w-44 rounded-xl" />
      </div>

      {/* 3 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              <SkeletonBox className="w-12 h-12 rounded-2xl" />
              <SkeletonBox className="w-4 h-4 rounded" />
            </div>
            <div className="space-y-2">
              <SkeletonBox className="h-9 w-16 rounded" />
              <SkeletonBox className="h-3.5 w-32 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Activity Timeline */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-zinc-200 shadow-sm p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <SkeletonBox className="h-4 rounded-md w-32" />
            <SkeletonBox className="h-3 rounded w-16" />
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-5 items-start">
                <SkeletonBox className="w-12 h-12 rounded-2xl shrink-0" />
                <div className="space-y-2 flex-1">
                  <SkeletonBox className="h-4 rounded w-1/3" />
                  <SkeletonBox className="h-3.5 rounded w-2/3" />
                </div>
                <SkeletonBox className="h-3 rounded w-16" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Navigation Cards */}
        <div className="space-y-6">
          <div className="bg-zinc-900 rounded-3xl p-8 shadow-xl border border-zinc-800 space-y-5">
            <SkeletonBox dark className="h-4 rounded w-28" />
            <div className="space-y-3">
              <SkeletonBox dark className="h-12 rounded-2xl w-full" />
              <SkeletonBox dark className="h-12 rounded-2xl w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ReaderDashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header with Search and Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <SkeletonBox className="h-9 w-56 rounded-xl" />
          <SkeletonBox className="h-4 w-72 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-11 w-64 rounded-xl" />
          <SkeletonBox className="h-11 w-11 rounded-xl shrink-0" />
          <SkeletonBox className="h-11 w-28 rounded-xl shrink-0" />
        </div>
      </div>

      {/* Active CFP Banner placeholder */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <SkeletonBox className="h-3.5 rounded w-36" />
          <SkeletonBox className="h-3.5 rounded w-24" />
        </div>
        <SkeletonBox className="h-16 rounded-xl w-full" />
      </div>

      {/* Maintenance notice card placeholder */}
      <div className="bg-amber-50/50 border border-amber-200/60 rounded-[2rem] p-6 sm:p-8 flex gap-4 items-center">
        <SkeletonBox className="w-12 h-12 rounded-2xl shrink-0" />
        <div className="space-y-2 flex-1">
          <SkeletonBox className="h-4 rounded w-48" />
          <SkeletonBox className="h-3 rounded w-3/4" />
        </div>
      </div>

      {/* Articles Grid (NO ghost stats!) */}
      <div className="space-y-6 pt-4">
        <div className="flex justify-between items-center border-b border-zinc-200 pb-4">
          <SkeletonBox className="h-6 rounded-lg w-36" />
          <SkeletonBox className="h-4 rounded w-24" />
        </div>
        <SkeletonArticleCard count={6} />
      </div>
    </div>
  );
};

export const AdminPublishedArticlesSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <SkeletonBox className="h-3 rounded w-24" />
          <SkeletonBox className="h-9 w-64 rounded-xl" />
          <SkeletonBox className="h-4 w-96 rounded-lg" />
        </div>
        <SkeletonBox className="h-11 w-72 rounded-xl" />
      </div>

      {/* 4 Stats Summary Cards (prevents layout shift!) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="bg-white border border-zinc-100 p-6 rounded-3xl shadow-sm space-y-4">
            <SkeletonBox className="w-12 h-12 rounded-2xl" />
            <div className="space-y-1.5">
              <SkeletonBox className="h-3 rounded w-24" />
              <SkeletonBox className="h-7 rounded w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Articles Section */}
      <SkeletonArticleCard count={6} />
    </div>
  );
};

export const AdminReadersListSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <SkeletonBox className="h-3 rounded w-20" />
          <SkeletonBox className="h-9 w-64 rounded-xl" />
          <SkeletonBox className="h-4 w-96 rounded-lg" />
        </div>
        <div className="flex gap-3">
          <SkeletonBox className="h-10 w-64 rounded-xl" />
          <SkeletonBox className="h-10 w-48 rounded-xl" />
        </div>
      </div>

      {/* 4 Overview Stat Metric Cards (prevents layout shift!) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="bg-white border border-zinc-200 p-5 rounded-3xl shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <SkeletonBox className="w-10 h-10 rounded-xl" />
              <SkeletonBox className="h-5 rounded-full w-20" />
            </div>
            <SkeletonBox className="h-8 rounded w-16" />
            <SkeletonBox className="h-3 rounded w-28" />
          </div>
        ))}
      </div>

      {/* Table */}
      <SkeletonTable rowsCount={6} colsCount={5} />
    </div>
  );
};

export const AdminLifeMembersSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in px-4">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonBox className="h-3 rounded w-32" />
        <SkeletonBox className="h-9 w-64 rounded-xl" />
        <SkeletonBox className="h-4 w-full max-w-xl rounded-lg" />
      </div>

      {/* 3 Compact Metric Cards (prevents layout shift!) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SkeletonBox className="w-9 h-9 rounded-xl shrink-0" />
              <div className="space-y-1">
                <SkeletonBox className="h-2.5 rounded w-20" />
                <SkeletonBox className="h-5 rounded w-12" />
              </div>
            </div>
            <SkeletonBox className="h-5 rounded-full w-16" />
          </div>
        ))}
      </div>

      {/* Table */}
      <SkeletonTable rowsCount={6} colsCount={5} />
    </div>
  );
};

export const AdminPaymentsSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <SkeletonBox className="h-9 w-64 rounded-xl" />
          <SkeletonBox className="h-4 w-96 rounded-lg" />
        </div>
        <div className="flex gap-3">
          <SkeletonBox className="h-10 w-64 rounded-xl" />
          <SkeletonBox className="h-10 w-48 rounded-xl" />
        </div>
      </div>

      {/* 3 Statistical Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <SkeletonBox className="h-3 rounded w-28" />
              <SkeletonBox className="w-9 h-9 rounded-xl" />
            </div>
            <SkeletonBox className="h-7 rounded w-24" />
            <SkeletonBox className="h-3 rounded w-36" />
          </div>
        ))}
      </div>

      {/* Pending Queue Table */}
      <div className="space-y-4">
        <SkeletonBox className="h-5 rounded w-48" />
        <SkeletonTable rowsCount={4} colsCount={7} />
      </div>
    </div>
  );
};

export const AdminCallForPapersSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <SkeletonBox className="h-9 w-64 rounded-xl" />
          <SkeletonBox className="h-4 w-96 rounded-lg" />
        </div>
        <div className="flex gap-3">
          <SkeletonBox className="h-10 w-24 rounded-xl" />
          <SkeletonBox className="h-10 w-44 rounded-xl" />
        </div>
      </div>

      {/* 5 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-2 shadow-sm">
            <SkeletonBox className="h-3 rounded w-20" />
            <SkeletonBox className="h-7 rounded w-12" />
          </div>
        ))}
      </div>

      {/* Tabs bar */}
      <div className="flex gap-2 border-b border-zinc-200 pb-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonBox key={i} className="h-9 rounded-xl w-24" />
        ))}
      </div>

      {/* Cards Grid */}
      <SkeletonCFPCard count={4} />
    </div>
  );
};

export const AuthorRevisionRequiredSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonBox className="h-9 w-64 rounded-xl" />
        <SkeletonBox className="h-4 w-80 rounded-lg" />
      </div>

      {/* 2-Column Split: Table on left, Details on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <SkeletonTable rowsCount={4} colsCount={3} />
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-sm space-y-5">
            <SkeletonBox className="h-5 rounded-md w-36" />
            <div className="space-y-3">
              <SkeletonBox className="h-4 rounded w-full" />
              <SkeletonBox className="h-3.5 rounded w-5/6" />
              <SkeletonBox className="h-3.5 rounded w-4/6" />
            </div>
            <SkeletonBox className="h-11 rounded-xl w-full mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const DeveloperDashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-12 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonBox className="h-3 rounded w-36" />
        <SkeletonBox className="h-9 w-64 rounded-xl" />
        <SkeletonBox className="h-4 w-96 rounded-lg" />
      </div>

      {/* 4 Telemetry Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <SkeletonBox className="w-10 h-10 rounded-xl" />
              <SkeletonBox className="w-4 h-4 rounded" />
            </div>
            <div className="space-y-1.5">
              <SkeletonBox className="h-3 rounded w-24" />
              <SkeletonBox className="h-8 rounded w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Issues Table */}
      <SkeletonTable rowsCount={5} colsCount={5} />
    </div>
  );
};

export const DeveloperIssuesSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <SkeletonBox className="h-3 rounded w-36" />
          <SkeletonBox className="h-9 w-64 rounded-xl" />
          <SkeletonBox className="h-4 w-80 rounded-lg" />
        </div>
        <div className="flex gap-3">
          <SkeletonBox className="h-10 w-64 rounded-xl" />
          <SkeletonBox className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* Table */}
      <SkeletonTable rowsCount={6} colsCount={6} />
    </div>
  );
};

export const ReaderPaymentsSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <SkeletonBox className="h-9 w-56 rounded-xl" />
          <SkeletonBox className="h-4 w-72 rounded-lg" />
        </div>
        <div className="flex gap-3">
          <SkeletonBox className="h-10 w-64 rounded-xl" />
          <SkeletonBox className="h-10 w-44 rounded-xl" />
        </div>
      </div>

      {/* Table */}
      <SkeletonTable rowsCount={5} colsCount={6} />
    </div>
  );
};

export const ArticlesSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <SkeletonBox className="h-8 w-64 rounded-xl" />
          <SkeletonBox className="h-4 w-80 rounded-lg" />
        </div>
        <SkeletonBox className="h-10 w-64 rounded-xl" />
      </div>
      <SkeletonArticleCard count={6} />
    </div>
  );
};

export const NotificationsSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fade-in px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-6">
        <div className="space-y-2">
          <SkeletonBox className="h-3 rounded w-36" />
          <SkeletonBox className="h-9 w-56 rounded-xl" />
          <SkeletonBox className="h-4 w-72 rounded-lg" />
        </div>
        <SkeletonBox className="h-10 w-56 rounded-2xl" />
      </div>

      {/* Notification items */}
      <SkeletonNotification count={5} />
    </div>
  );
};

export const SettingsSkeleton: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="space-y-2">
        <SkeletonBox className="h-8 w-48 rounded-xl" />
        <SkeletonBox className="h-4 w-72 rounded-lg" />
      </div>
      <CardSkeleton className="space-y-6">
        <SkeletonBox className="h-6 w-1/3 rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <SkeletonBox className="h-4 w-1/4 rounded-md" />
            <SkeletonBox className="h-11 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <SkeletonBox className="h-4 w-1/4 rounded-md" />
            <SkeletonBox className="h-11 w-full rounded-xl" />
          </div>
        </div>
        <SkeletonBox className="h-11 w-36 rounded-xl mt-4" />
      </CardSkeleton>
    </div>
  );
};

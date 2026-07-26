import React from 'react';
import PublicHeader from '../PublicHeader';
import PublicFooter from '../PublicFooter';
import { SkeletonStatistics } from './SkeletonStatistics';
import { SkeletonArticleCard } from './SkeletonArticleCard';
import { SkeletonTable } from './SkeletonTable';
import { SkeletonNotification } from './SkeletonNotification';
import { SkeletonProfile } from './SkeletonProfile';
import { CardSkeleton, SkeletonBox, AvatarSkeleton, TextSkeleton, ButtonSkeleton } from './SkeletonBase';

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
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in">
      <div className="space-y-2">
        <SkeletonBox className="h-8 w-64 rounded-xl" />
        <SkeletonBox className="h-4 w-96 rounded-lg" />
      </div>
      <SkeletonStatistics count={5} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        <div className="lg:col-span-2 space-y-4">
          <SkeletonBox className="h-6 w-48 rounded-lg mb-4" />
          <SkeletonArticleCard count={3} />
        </div>
        <div className="space-y-4">
          <SkeletonBox className="h-6 w-36 rounded-lg mb-4" />
          <CardSkeleton className="h-[320px] flex flex-col justify-between">
            <div className="space-y-4">
              <SkeletonBox className="h-5 w-3/4 rounded-md" />
              <SkeletonBox className="h-4 w-full rounded-md" />
              <SkeletonBox className="h-4 w-5/6 rounded-md" />
            </div>
            <SkeletonBox className="h-10 w-full rounded-xl" />
          </CardSkeleton>
        </div>
      </div>
    </div>
  );
};

export const AuthorDashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in">
      <div className="space-y-2">
        <SkeletonBox className="h-8 w-64 rounded-xl" />
        <SkeletonBox className="h-4 w-96 rounded-lg" />
      </div>
      <SkeletonStatistics count={4} />
      <div className="space-y-4 pt-4">
        <SkeletonBox className="h-6 w-48 rounded-lg mb-4" />
        <SkeletonArticleCard count={3} />
      </div>
    </div>
  );
};

export const ReviewerDashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in">
      <div className="space-y-2">
        <SkeletonBox className="h-8 w-64 rounded-xl" />
        <SkeletonBox className="h-4 w-96 rounded-lg" />
      </div>
      <SkeletonStatistics count={3} />
      <div className="space-y-4 pt-4">
        <SkeletonBox className="h-6 w-48 rounded-lg mb-4" />
        <SkeletonArticleCard count={3} />
      </div>
    </div>
  );
};

export const ReaderDashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div className="space-y-2">
          <SkeletonBox className="h-8 w-48 rounded-xl" />
          <SkeletonBox className="h-4 w-64 rounded-lg" />
        </div>
        <div className="flex gap-3">
          <SkeletonBox className="h-10 w-64 rounded-xl" />
          <SkeletonBox className="h-10 w-36 rounded-xl" />
        </div>
      </div>
      <SkeletonStatistics count={4} />
      <SkeletonArticleCard count={6} />
    </div>
  );
};

export const DeveloperDashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in">
      <div className="space-y-2">
        <SkeletonBox className="h-8 w-64 rounded-xl" />
        <SkeletonBox className="h-4 w-96 rounded-lg" />
      </div>
      <SkeletonStatistics count={4} />
      <SkeletonTable rowsCount={4} colsCount={5} />
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
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <SkeletonBox className="h-8 w-48 rounded-xl" />
        <SkeletonBox className="h-8 w-32 rounded-lg" />
      </div>
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

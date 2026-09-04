import React from 'react';
import { SkeletonBox } from './SkeletonBase';

export const SkeletonAuth: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100 px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-zinc-200">
        <div className="flex flex-col md:grid md:grid-cols-2 min-h-[480px] md:min-h-[520px]">
          {/* Left / Top: Branding Panel */}
          <div className="bg-gradient-to-br from-black to-zinc-900 text-white p-8 sm:p-10 flex flex-col justify-between">
            <div className="space-y-6">
              <SkeletonBox dark className="w-14 h-14 rounded-2xl" />
              <div className="space-y-2">
                <SkeletonBox dark className="h-6 rounded-lg w-3/4" />
                <SkeletonBox dark className="h-4 rounded-md w-full" />
                <SkeletonBox dark className="h-4 rounded-md w-5/6" />
              </div>
            </div>

            <div className="space-y-3 pt-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <SkeletonBox dark className="w-6 h-6 rounded-full shrink-0" />
                  <SkeletonBox dark className="h-3.5 rounded w-4/5" />
                </div>
              ))}
            </div>
          </div>

          {/* Right / Bottom: Form Panel */}
          <div className="bg-white p-8 sm:p-10 flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <SkeletonBox className="h-8 rounded-xl w-48" />
              <SkeletonBox className="h-4 rounded-md w-64" />
            </div>

            {/* Inputs */}
            <div className="space-y-4 flex-1">
              <div className="space-y-1.5">
                <SkeletonBox className="h-3 rounded w-20" />
                <SkeletonBox className="h-11 rounded-xl w-full" />
              </div>
              <div className="space-y-1.5">
                <SkeletonBox className="h-3 rounded w-20" />
                <SkeletonBox className="h-11 rounded-xl w-full" />
              </div>
              <SkeletonBox className="h-11 rounded-xl w-full mt-2" />
            </div>

            {/* Bottom link */}
            <div className="flex justify-center pt-2">
              <SkeletonBox className="h-4 rounded w-48" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { SkeletonBox } from './SkeletonBase';

export const SkeletonAcceptInvitation: React.FC = () => {
  return (
    <div className="min-h-screen bg-zinc-50 py-20 px-4 animate-fade-in">
      <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] border border-zinc-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-10 border-b border-zinc-50 text-center bg-gradient-to-b from-zinc-50/50 to-white flex flex-col items-center">
          <SkeletonBox className="w-16 h-16 rounded-2xl mb-6 shadow-md" />
          <SkeletonBox className="h-3 rounded w-36 mb-3" />
          <SkeletonBox className="h-8 rounded-xl w-64" />
        </div>

        {/* Content */}
        <div className="p-10 space-y-8">
          <div className="space-y-6">
            {/* Inviter item */}
            <div className="flex items-start gap-4">
              <SkeletonBox className="w-10 h-10 rounded-xl shrink-0" />
              <div className="space-y-2 flex-1">
                <SkeletonBox className="h-2.5 rounded w-20" />
                <SkeletonBox className="h-4 rounded w-48" />
              </div>
            </div>

            {/* Article item */}
            <div className="flex items-start gap-4">
              <SkeletonBox className="w-10 h-10 rounded-xl shrink-0" />
              <div className="space-y-2 flex-1">
                <SkeletonBox className="h-2.5 rounded w-28" />
                <SkeletonBox className="h-5 rounded-lg w-full" />
                <SkeletonBox className="h-3.5 rounded w-5/6" />
                <SkeletonBox className="h-3.5 rounded w-4/6" />
              </div>
            </div>

            {/* Role item */}
            <div className="flex items-start gap-4">
              <SkeletonBox className="w-10 h-10 rounded-xl shrink-0" />
              <div className="space-y-2 flex-1">
                <SkeletonBox className="h-2.5 rounded w-24" />
                <SkeletonBox className="h-4 rounded w-32" />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-6 border-t border-zinc-100 flex flex-col sm:flex-row gap-4">
            <SkeletonBox className="h-12 rounded-xl flex-1" />
            <SkeletonBox className="h-12 rounded-xl flex-1" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonAcceptInvitation;

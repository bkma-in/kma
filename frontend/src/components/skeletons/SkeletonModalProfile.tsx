import React from 'react';
import { SkeletonBox } from './SkeletonBase';
import { cn } from '../../utils/cn';

interface SkeletonModalProfileProps {
  dark?: boolean;
  className?: string;
}

export const SkeletonModalProfile: React.FC<SkeletonModalProfileProps> = ({ 
  dark = false, 
  className = "" 
}) => {
  return (
    <div className={cn("space-y-6 w-full animate-fade-in", className)}>
      {/* Top Identity Card */}
      <div className={cn(
        "flex flex-col sm:flex-row items-center sm:items-start gap-5 p-6 rounded-3xl border",
        dark ? "bg-zinc-900/60 border-zinc-800" : "bg-zinc-50 border-zinc-100"
      )}>
        {/* Avatar */}
        <SkeletonBox 
          dark={dark} 
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full shrink-0" 
        />

        {/* Title & Metadata */}
        <div className="space-y-2.5 text-center sm:text-left flex-1 w-full">
          <SkeletonBox dark={dark} className="h-6 sm:h-7 rounded-lg w-1/2 mx-auto sm:mx-0" />
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <SkeletonBox dark={dark} className="h-5 rounded-full w-28" />
            <SkeletonBox dark={dark} className="h-5 rounded-full w-36" />
          </div>
          <SkeletonBox dark={dark} className="h-3.5 rounded w-1/3 mx-auto sm:mx-0" />
        </div>
      </div>

      {/* Bio / Description section */}
      <div className={cn(
        "p-6 rounded-3xl border space-y-3",
        dark ? "bg-zinc-900/40 border-zinc-800/60" : "bg-white border-zinc-100"
      )}>
        <SkeletonBox dark={dark} className="h-4 rounded-md w-24 mb-2" />
        <SkeletonBox dark={dark} className="h-3.5 rounded w-full" />
        <SkeletonBox dark={dark} className="h-3.5 rounded w-full" />
        <SkeletonBox dark={dark} className="h-3.5 rounded w-4/5" />
      </div>

      {/* Grid details (Affiliation, Email, Phone, etc.) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className={cn(
              "p-4 rounded-2xl border space-y-2",
              dark ? "bg-zinc-900/30 border-zinc-800/50" : "bg-zinc-50/60 border-zinc-100"
            )}
          >
            <SkeletonBox dark={dark} className="h-3 rounded w-20" />
            <SkeletonBox dark={dark} className="h-4 rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkeletonModalProfile;

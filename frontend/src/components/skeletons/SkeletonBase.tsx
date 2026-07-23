import React from 'react';
import { cn } from '../../utils/cn';

interface SkeletonBoxProps {
  className?: string;
  style?: React.CSSProperties;
  dark?: boolean;
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({ className, style, dark = false }) => {
  return (
    <div 
      className={cn(dark ? "skeleton-box-dark rounded-lg" : "skeleton-box rounded-lg", className)} 
      style={style} 
    />
  );
};

export const TextSkeleton: React.FC<{
  lines?: number;
  className?: string;
  widths?: string[];
  height?: string;
}> = ({ lines = 1, className = "", widths, height = "h-4" }) => {
  return (
    <div className={cn("space-y-2.5 w-full", className)}>
      {Array.from({ length: lines }).map((_, idx) => {
        const w = widths && widths[idx] ? widths[idx] : idx === lines - 1 && lines > 1 ? "w-2/3" : "w-full";
        return (
          <SkeletonBox key={idx} className={cn(height, w)} />
        );
      })}
    </div>
  );
};

export const AvatarSkeleton: React.FC<{
  size?: string;
  className?: string;
}> = ({ size = "w-10 h-10", className = "" }) => {
  return <SkeletonBox className={cn("rounded-full shrink-0", size, className)} />;
};

export const ButtonSkeleton: React.FC<{
  width?: string;
  height?: string;
  className?: string;
}> = ({ width = "w-28", height = "h-10", className = "" }) => {
  return <SkeletonBox className={cn("rounded-xl shrink-0", width, height, className)} />;
};

export const BadgeSkeleton: React.FC<{
  width?: string;
  className?: string;
}> = ({ width = "w-20", className = "" }) => {
  return <SkeletonBox className={cn("h-5 rounded-full shrink-0", width, className)} />;
};

export const CardSkeleton: React.FC<{
  children?: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  return (
    <div className={cn("bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm", className)}>
      {children}
    </div>
  );
};

export const ListItemSkeleton: React.FC<{
  className?: string;
}> = ({ className = "" }) => {
  return (
    <div className={cn("bg-white border border-zinc-100 p-5 rounded-2xl shadow-sm flex items-center justify-between gap-4", className)}>
      <div className="flex items-center gap-4 flex-1">
        <AvatarSkeleton size="w-10 h-10" />
        <div className="flex-1 space-y-2">
          <SkeletonBox className="h-4 w-1/3" />
          <SkeletonBox className="h-3 w-2/3" />
        </div>
      </div>
      <ButtonSkeleton width="w-20" height="h-8" />
    </div>
  );
};

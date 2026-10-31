import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "", ...props }) => {
  return (
    <div
      aria-hidden="true"
      className={`cc-skeleton ${className}`.trim()}
      {...props}
    />
  );
};

export const EventCardSkeleton: React.FC = () => {
  return (
    <div className="p-6 sm:p-8 bg-[var(--surface)] border border-[var(--border)] rounded-sm flex flex-col justify-between gap-6 relative">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-7 w-3/4 mt-1" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>

      <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  );
};

export const ProjectCardSkeleton: React.FC = () => {
  return (
    <div className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-sm flex flex-col justify-between gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-full mt-1" />
        <Skeleton className="h-4 w-5/6" />
        <div className="flex gap-2 mt-2">
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-12" />
        </div>
      </div>
      <div className="pt-4 border-t border-[var(--border)] flex gap-3">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
};

export const TeamCardSkeleton: React.FC = () => {
  return (
    <div className="w-full h-full p-4 sm:p-5 bg-[var(--surface-1)] border border-[var(--border)] rounded-md shadow-1 flex flex-col justify-between gap-4 text-left">
      <div className="w-full flex flex-col gap-4">
        <Skeleton className="w-full aspect-[4/5] rounded-sm" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between w-full">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
};

export const GalleryCardSkeleton: React.FC = () => {
  return (
    <div className="border border-[var(--border)] rounded-sm overflow-hidden bg-[var(--surface)]">
      <Skeleton className="aspect-video w-full" />
      <div className="p-4 flex flex-col gap-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
};

export const AdminTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full border border-[var(--border)] rounded-sm overflow-hidden bg-[var(--surface)]">
      <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-raised)] flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="divide-y divide-[var(--border)]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
};

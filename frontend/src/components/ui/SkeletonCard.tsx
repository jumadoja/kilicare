'use client';
import { cn } from '@/lib/utils';

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('skeleton rounded-lg', className)}
    />
  );
}

export function MomentSkeleton() {
  return (
    <div className="w-full h-dvh bg-dark-surface relative overflow-hidden">
      <Skeleton className="absolute inset-0 rounded-none" />
      <div className="absolute bottom-20 left-4 right-16 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <div className="absolute right-3 bottom-24 flex flex-col gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="w-10 h-10 rounded-full" />
        ))}
      </div>
    </div>
  );
}

export function TipSkeleton() {
  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{ background: 'rgba(19,19,26,0.8)', border: '1px solid rgba(42,42,58,0.8)' }}
    >
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

export function ContactSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-44" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
    </div>
  );
}

export function PassportSkeleton() {
  return (
    <div
      className="mx-4 rounded-2xl p-5 space-y-4"
      style={{
        background: 'linear-gradient(135deg, rgba(26,18,8,0.8), rgba(10,10,15,0.8))',
        border: '1px solid rgba(245,166,35,0.1)',
      }}
    >
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-5 w-40" />
      <div className="flex items-center gap-3 mt-2">
        <Skeleton className="w-14 h-14 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-20 rounded-lg" />
        </div>
      </div>
      <div className="flex gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1 rounded-xl p-3 space-y-2"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            <Skeleton className="h-5 w-12 mx-auto" />
            <Skeleton className="h-3 w-10 mx-auto" />
          </div>
        ))}
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}

export function GridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-none" />
      ))}
    </div>
  );
}

export function MessageBubbleSkeleton({ isOwn = false }: { isOwn?: boolean }) {
  return (
    <div className={cn('flex items-end gap-2 px-4 py-1', isOwn && 'flex-row-reverse')}>
      {!isOwn && <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />}
      <Skeleton
        className={cn(
          'h-10 rounded-2xl',
          isOwn ? 'w-48 rounded-br-sm' : 'w-56 rounded-bl-sm',
        )}
      />
    </div>
  );
}

export function ExperienceSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(19,19,26,0.8)', border: '1px solid rgba(42,42,58,0.8)' }}
    >
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Skeleton className="w-6 h-6 rounded-full" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}
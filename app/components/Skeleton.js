export function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse bg-[var(--border)] rounded ${className}`}
    />
  )
}

export function SkeletonCard({ className = "" }) {
  return (
    <div className={`bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 ${className}`}>
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-8 w-full mb-2" />
      <Skeleton className="h-8 w-3/4" />
    </div>
  )
}

export function SkeletonText({ lines = 3, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 5, className = "" }) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 pt-3 border-t border-[var(--border)]">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonProfile() {
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="flex gap-3 mt-4 pt-4 border-t border-[var(--border)]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-1 text-center">
            <Skeleton className="h-6 w-12 mx-auto mb-1" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 text-center">
          <Skeleton className="h-3 w-16 mx-auto mb-2" />
          <Skeleton className="h-8 w-20 mx-auto" />
        </div>
      ))}
    </div>
  )
}

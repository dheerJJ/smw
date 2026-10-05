import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200/80", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

/**
 * Pre-configured Table Skeleton that prevents Cumulative Layout Shift (CLS)
 */
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full divide-y divide-slate-100 overflow-hidden" role="status" aria-label="Loading table data">
      <div className="bg-slate-50 p-3.5 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`head-${i}`} className="h-4 flex-1 bg-slate-200" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={`row-${r}`} className="p-3.5 flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={`cell-${r}-${c}`}
              className={cn("h-4 flex-1", c === 0 ? "w-1/4" : "w-auto")}
            />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading records...</span>
    </div>
  );
}

/**
 * Pre-configured Card Skeleton
 */
export function CardSkeleton() {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3" role="status">
      <div className="flex justify-between items-center">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-3 w-36" />
      <span className="sr-only">Loading card data...</span>
    </div>
  );
}

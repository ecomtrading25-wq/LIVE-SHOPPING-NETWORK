import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Reusable skeleton loading component for AI dashboards
 * Provides consistent loading experience across all dashboard pages
 */

export function DashboardHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

export function DashboardMetricCardSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
      <Skeleton className="h-9 w-24 mb-1" />
      <Skeleton className="h-4 w-40" />
    </Card>
  );
}

export function DashboardChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Card className="p-6">
      <Skeleton className="h-6 w-48 mb-4" />
      <Skeleton className="h-[${height}px] w-full" />
    </Card>
  );
}

export function DashboardTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="p-6">
      <Skeleton className="h-6 w-48 mb-4" />
      <div className="space-y-3">
        {/* Table header */}
        <div className="flex gap-4 pb-3 border-b">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 flex-1" />
        </div>
        {/* Table rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 py-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function DashboardFullPageSkeleton() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <DashboardHeaderSkeleton />
        
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <DashboardMetricCardSkeleton />
          <DashboardMetricCardSkeleton />
          <DashboardMetricCardSkeleton />
          <DashboardMetricCardSkeleton />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardChartSkeleton />
          <DashboardChartSkeleton />
        </div>

        {/* Table */}
        <DashboardTableSkeleton />
      </div>
    </div>
  );
}

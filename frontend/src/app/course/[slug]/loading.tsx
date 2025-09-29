import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-6 w-48" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column skeleton */}
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <Skeleton className="h-6 w-40 mb-4" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </div>

          {/* Right column skeleton */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-96 w-full rounded-lg" />
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

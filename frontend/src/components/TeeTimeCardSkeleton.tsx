import { Skeleton } from "@/components/ui/skeleton";

export default function TeeTimeCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full max-w-full">
      <div className="p-5 w-full max-w-full">
        {/* Header Section */}
        <div className="flex flex-col gap-3 mb-4">
          <div>
            <div className="flex items-start">
              {/* Course name */}
              <Skeleton className="h-6 w-3/4" />
              {/* Remove button */}
              <Skeleton className="flex-shrink-0 w-5 h-5 rounded-full ml-1 mt-0.5" />
            </div>
            <div className="flex items-center gap-2 mb-2 flex-wrap mt-2">
              {/* City */}
              <Skeleton className="h-4 w-20" />
              {/* Distance */}
              <Skeleton className="h-4 w-12" />
            </div>
            {/* Rating */}
            <div className="flex items-center gap-1 mt-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="w-4 h-4 rounded-sm" />
              ))}
              <Skeleton className="h-4 w-10 ml-1" />
            </div>
          </div>
        </div>

        {/* Weather Section */}
        <div className="w-full max-w-full overflow-hidden">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-indigo-50 rounded-lg border border-blue-100">
            {/* Weather Icon */}
            <Skeleton className="flex-shrink-0 w-6 h-6 rounded" />
            
            {/* Weather Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 text-sm flex-wrap">
                {/* Temperature */}
                <div className="flex items-center gap-1">
                  <Skeleton className="w-4 h-4 rounded" />
                  <Skeleton className="h-4 w-10" />
                </div>
                
                {/* Precipitation */}
                <div className="flex items-center gap-1">
                  <Skeleton className="w-4 h-4 rounded" />
                  <Skeleton className="h-4 w-8" />
                </div>
                
                {/* Wind Speed */}
                <div className="flex items-center gap-1">
                  <Skeleton className="w-4 h-4 rounded" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
              
              {/* Weather Description */}
              <Skeleton className="h-3 w-24 mt-1" />
            </div>
          </div>
        </div>

        {/* Tee Time Details */}
        <div className="flex flex-col gap-3 mt-4 w-full max-w-full">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              {/* Time */}
              <Skeleton className="h-7 w-24" />
              <div className="flex items-center gap-2 sm:gap-4 text-sm flex-wrap mt-1">
                {/* Holes badge */}
                <Skeleton className="h-6 w-16 rounded-full" />
                {/* Players badge */}
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              {/* Price */}
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-16 mt-1" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-4 border-t border-gray-100 w-full max-w-full">
          <div className="flex gap-3 w-full">
            {/* Booking Button */}
            <Skeleton className="flex-1 h-12 rounded-lg" />
            {/* Share Button */}
            <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}

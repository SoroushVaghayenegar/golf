import { Skeleton } from "@/components/ui/skeleton";

export default function CourseCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100 overflow-hidden flex flex-col h-full">
      {/* Course Image Skeleton */}
      <div className="relative w-full h-40 md:h-56 lg:h-64">
        <Skeleton className="w-full h-full" />
      </div>

      {/* Course Content Skeleton */}
      <div className="p-6 flex flex-col flex-1">
        {/* Course Name */}
        <Skeleton className="h-6 w-3/4 mb-3" />
        
        {/* Course Description */}
        <div className="space-y-2 mb-6 flex-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
        
        {/* Button Skeleton */}
        <Skeleton className="w-full h-12 rounded-lg mt-auto" />
      </div>
    </div>
  );
}

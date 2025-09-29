"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const CourseMap = dynamic(() => import('@/components/CourseMap'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[400px] bg-gray-100 rounded-lg" />
});

interface CourseMapWrapperProps {
  latitude: number;
  longitude: number;
  courseName: string;
}

export default function CourseMapWrapper({ latitude, longitude, courseName }: CourseMapWrapperProps) {
  return (
    <CourseMap 
      latitude={latitude} 
      longitude={longitude} 
      courseName={courseName}
    />
  );
}

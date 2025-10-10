import { fetchCourse, CourseDetail } from '@/services/coursesService';
import { MapPin, Phone, Clock, Star, Navigation } from 'lucide-react';
import { Rating } from '@/components/ui/rating';
import Image from 'next/image';
import Link from 'next/link';
import CourseMapWrapper from '@/components/CourseMapWrapper';
import { CourseMetadataGenerator } from '@/utils/Metadata';
import { Metadata } from 'next';

// Utility function to get tomorrow's date
const getTomorrowDate = (): string => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
};


interface CoursePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  
  const course = await fetchCourse(slug);

  // Check if course data has the required properties (not just truthy)
  if (!course || !('name' in course) || !('city_name' in course)) {
    return {};
  }

  // Now we know it's a valid CourseDetail
  const courseDetail = course as CourseDetail;

  // Use CourseMetadataGenerator to create comprehensive metadata
  return CourseMetadataGenerator({
    courseName: courseDetail.name,
    courseImage: courseDetail.image_url || '/golf-course.png', // fallback image
    cityName: courseDetail.city_name,
    courseSlug: slug,
  });
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = await fetchCourse(slug);

  // If course data is empty or invalid, show not found
  if (!course || !('name' in course)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Course Not Found</h1>
          <p className="text-gray-600 mb-6">The course you&apos;re looking for doesn&apos;t exist.</p>
          <Link 
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  // Now we know it's a valid CourseDetail
  const courseDetail = course as CourseDetail;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-4">
          <nav className="text-sm text-gray-600 mb-4">
            <Link href="/regions" className="hover:text-blue-600">Regions</Link>
            <span className="mx-2">/</span>
            <Link href={"/regions/" + courseDetail.region_slug} className="hover:text-blue-600">{courseDetail.region_name}</Link>
            <span className="mx-2">/</span>
            <Link href={"/city/" + courseDetail.city_slug} className="hover:text-blue-600">{courseDetail.city_name}</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{courseDetail.name}</span>
          </nav>
          
          <h1 className="text-3xl font-bold text-gray-900">{courseDetail.name}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
          {/* Left Column - Course Image and Details */}
          <div className="flex flex-col gap-6">
            {/* Course Image */}
            {courseDetail.image_url && (
              <div className="relative h-80 w-full rounded-lg overflow-hidden">
                <Image
                  src={courseDetail.image_url}
                  alt={courseDetail.name}
                  fill
                  className="object-cover object-bottom"
                  priority
                />
              </div>
            )}

            {/* Course Description */}
            {courseDetail.description && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Course</h2>
                <p className="text-gray-600 leading-relaxed">{courseDetail.description}</p>
              </div>
            )}

            {/* Course Information */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Information</h2>
              
              <div className="space-y-4">
                {/* Rating */}
                {courseDetail.rating && (
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <Rating value={courseDetail.rating} showValue={true} size="md" />
                  </div>
                )}

                {/* Address */}
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Address</p>
                    <p className="text-gray-600">{courseDetail.address}</p>
                  </div>
                </div>

                {/* Phone Number */}
                {courseDetail.phone_number && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Phone</p>
                      <a 
                        href={`tel:${courseDetail.phone_number}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {courseDetail.phone_number}
                      </a>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* Right Column - Map */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
              <CourseMapWrapper 
                latitude={courseDetail.latitude} 
                longitude={courseDetail.longitude} 
                courseName={courseDetail.name}
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(courseDetail.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Navigation className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-900 font-medium">Get Directions</span>
                </a>
                
                {courseDetail.phone_number && (
                  <a
                    href={`tel:${courseDetail.phone_number}`}
                    className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <Phone className="w-5 h-5 text-green-600" />
                    <span className="text-green-900 font-medium">Call Course</span>
                  </a>
                )}
                
                <Link
                  href={`/search?dates=${getTomorrowDate()}&players=any&holes=any&timeRange=5-22&region=${courseDetail.region_id}&sort=startTime&courseIds=${courseDetail.id}`}
                  className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span className="text-purple-900 font-medium">Find Tee Times</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchCityCourses, CityCoursesData, Course } from '@/services/coursesService';
import { fetchCityBySlug, City } from '@/services/cityService';
import { CityMetadataGenerator } from '@/utils/Metadata';
import { Metadata } from 'next';
import CityFAQComponent from '@/components/CityFAQComponent';

interface CityPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { slug: citySlug } = await params;
  
  console.log('Generating metadata for city:', citySlug); // Debug log
  
  let coursesData: CityCoursesData;
  let cityInfo: City;
  
  try {
    // Fetch both in parallel for better performance
    [coursesData, cityInfo] = await Promise.all([
      fetchCityCourses(citySlug),
      fetchCityBySlug(citySlug)
    ]);
    console.log('City courses data fetched:', coursesData); // Debug log
  } catch (error) {
    console.error('Error fetching city courses for metadata:', error);
    // Return fallback metadata instead of empty object
    return {
      title: `Golf Courses | TeeClub`,
      description: 'Find the best golf courses and book tee times faster with TeeClub - Canada\'s #1 tee time search platform.',
    };
  }

  // Check if city data is valid - be less restrictive
  if (!coursesData || !coursesData.city) {
    console.log('Invalid city courses data, returning fallback metadata'); // Debug log
    return {
      title: `Golf Courses | TeeClub`,
      description: 'Find the best golf courses and book tee times faster with TeeClub - Canada\'s #1 tee time search platform.',
    };
  }

  // Map courses to the format expected by CityMetadataGenerator
  // Allow empty courses array - the CityMetadataGenerator can handle it
  const coursesForMeta = coursesData.courses.map((course: Course) => ({
    name: course.name,
    image: course.image_url || '/golf-course.png',
    slug: course.slug,
  }));

  console.log('Generating metadata with:', {
    cityName: coursesData.city.name,
    citySlug,
    coursesCount: coursesForMeta.length
  }); // Debug log

  // Use CityMetadataGenerator to create comprehensive metadata
  try {
    const metadata = CityMetadataGenerator({
      cityName: cityInfo.name,
      citySlug: citySlug,
      courses: coursesForMeta,
      // Use city image if available, otherwise fall back to first course image
      cityImage: cityInfo.image_url || undefined,
      // Pass FAQs for structured data
      faqs: cityInfo.faqs || undefined,
    });
    console.log('Metadata generated successfully:', metadata.title); // Debug log
    return metadata;
  } catch (metadataError) {
    console.error('Error generating metadata:', metadataError);
    // Return fallback metadata
    return {
      title: `${cityInfo.name} Golf Courses | TeeClub`,
      description: `Find golf courses and book tee times in ${cityInfo.name} with TeeClub - Canada's #1 tee time search platform.`,
    };
  }
}

export default async function CityPage({ params }: CityPageProps) {
  const { slug: citySlug } = await params;
  
  let cityData: CityCoursesData;
  let cityInfo: City;
  
  try {
    // Fetch both in parallel for better performance
    [cityData, cityInfo] = await Promise.all([
      fetchCityCourses(citySlug),
      fetchCityBySlug(citySlug)
    ]);
  } catch (error) {
    console.error('Error fetching city data:', error);
    notFound();
  }

  const getCourseUrl = (course: Course) => {
    return `/course/${course.slug}`;
  };

  const capitalizeCityName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header Section */}
      {cityData.courses.length > 0 && (
        <div className="relative py-16 px-6 overflow-hidden">
          {/* Background Image with Blur (if available) */}
          {cityInfo?.image_url && (
            <>
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${cityInfo.image_url})`,
                  transform: 'scale(1.1)', // Prevent blur edges from showing
                }}
              />
              <div className="absolute inset-0 bg-white/65" /> {/* White overlay for transparency */}
            </>
          )}
          
          {/* Fallback Gradient (if no image) */}
          {!cityInfo?.image_url && (
            <div className="absolute inset-0 bg-gradient-to-b from-slate-200 to-amber-100" />
          )}

          {/* Breadcrumb Navigation - Overlaid on header */}
          {cityInfo?.regions && (
            <div className="absolute top-6 left-6 z-20">
              <nav className="text-sm bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm">
                <Link href="/regions" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
                  Regions
                </Link>
                <span className="mx-2 text-gray-400">/</span>
                <Link 
                  href={`/regions/${cityInfo.regions.slug}`} 
                  className="text-gray-700 hover:text-green-600 font-medium transition-colors"
                >
                  {capitalizeCityName(cityInfo.regions.name)}
                </Link>
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-gray-900 font-semibold">{capitalizeCityName(cityData.city.name)}</span>
              </nav>
            </div>
          )}
          
          {/* Content */}
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Golf Courses in {capitalizeCityName(cityData.city.name)}
            </h1>
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              Explore {capitalizeCityName(cityData.city.name)}&apos;s premier golf courses, each offering unique challenges and beautiful scenery.
            </p>
          </div>
        </div>
      )}
      
      {/* Courses Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {cityData.courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cityData.courses.map((course) => (
              <Link
                key={course.id}
                href={getCourseUrl(course)}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-200 border border-gray-100 overflow-hidden flex flex-col h-full cursor-pointer group"
              >
                {/* Course Image */}
                <div className="relative w-full h-40 md:h-56 lg:h-64">
                  <Image
                    src={course.image_url || '/golf-course.png'}
                    alt={course.name}
                    fill
                    className="object-cover group-hover:brightness-110 transition-all duration-200"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>

                {/* Course Content */}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-green-700 transition-colors duration-200">
                    {course.name}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed flex-1">
                    {course.description}
                  </p>
                  
                  {/* Course Page Button Visual */}
                  <div className="w-full bg-green-600 group-hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2 mt-auto">
                    <span>🏌️</span>
                    View {course.name.split(' ')[0]} Course
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              City Not Found
            </h3>
            <p className="text-gray-600 mb-6">
              This city does not exist or is invalid.
            </p>
            <Link
              href="/cities"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Browse All Cities
            </Link>
          </div>
        )}
      </div>

      {/* FAQ Section */}
      {cityInfo && cityInfo.faqs && cityInfo.faqs.length > 0 && (
        <CityFAQComponent cityName={cityInfo.name} faqs={cityInfo.faqs} />
      )}
    </div>
  );
}


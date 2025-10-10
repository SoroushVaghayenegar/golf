import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchRegionCities, RegionCities, City } from '@/services/cityService';
import { RegionMetadataGenerator } from '@/utils/Metadata';
import { Metadata } from 'next';

interface RegionPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: RegionPageProps): Promise<Metadata> {
  const { slug: regionSlug } = await params;
  
  console.log('Generating metadata for region:', regionSlug);
  
  let regionData: RegionCities;
  
  try {
    regionData = await fetchRegionCities(regionSlug);
    console.log('Region data fetched:', regionData);
  } catch (error) {
    console.error('Error fetching region for metadata:', error);
    // Return fallback metadata
    return {
      title: `Golf Courses | TeeClub`,
      description: 'Find the best golf courses and book tee times faster with TeeClub - Canada\'s #1 tee time search platform.',
    };
  }

  // Check if region data is valid
  if (!regionData || !regionData.region || !regionData.cities) {
    console.log('Invalid region data, returning fallback metadata');
    return {
      title: `Golf Courses | TeeClub`,
      description: 'Find the best golf courses and book tee times faster with TeeClub - Canada\'s #1 tee time search platform.',
    };
  }

  // Use the first city image as the region image, or fallback
  const regionImage = regionData.cities.length > 0 
    ? regionData.cities[0].image_url || '/golf-course.png'
    : '/golf-course.png';

  const regionDescription = `Explore golf courses in ${regionData.region.name}. Find tee times across ${regionData.cities.length} ${regionData.cities.length === 1 ? 'city' : 'cities'} and book faster with TeeClub.`;

  console.log('Generating metadata with:', {
    regionName: regionData.region.name,
    regionSlug,
    citiesCount: regionData.cities.length
  });

  try {
    const metadata = RegionMetadataGenerator({
      regionName: regionData.region.name,
      regionImage: regionImage,
      regionDescription: regionDescription,
      regionSlug: regionSlug,
    });
    console.log('Metadata generated successfully:', metadata.title);
    return metadata;
  } catch (metadataError) {
    console.error('Error generating metadata:', metadataError);
    // Return fallback metadata
    return {
      title: `${regionData.region.name} Golf Courses | TeeClub`,
      description: `Find golf courses and book tee times in ${regionData.region.name} with TeeClub - Canada's #1 tee time search platform.`,
    };
  }
}

export default async function RegionPage({ params }: RegionPageProps) {
  const { slug: regionSlug } = await params;
  
  let regionData: RegionCities;
  
  try {
    regionData = await fetchRegionCities(regionSlug);
  } catch (error) {
    console.error('Error fetching region data:', error);
    notFound();
  }

  const getCityUrl = (city: City) => {
    return `/city/${city.slug}`;
  };

  const capitalizeRegionName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header Section */}
      {regionData.cities.length > 0 && (
        <div className="relative py-16 px-6 overflow-hidden">
          {/* Background Image with Blur (using first city image if available) */}
          {regionData.cities[0]?.image_url && (
            <>
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${regionData.region.image_url})`,
                  transform: 'scale(1.1)',
                }}
              />
              <div className="absolute inset-0 bg-white/65" />
            </>
          )}
          
          {/* Fallback Gradient (if no image) */}
          {!regionData.cities[0]?.image_url && (
            <div className="absolute inset-0 bg-gradient-to-b from-slate-200 to-amber-100" />
          )}

          {/* Breadcrumb Navigation - Overlaid on header */}
          <div className="absolute top-6 left-6 z-20">
            <nav className="text-sm bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm">
              <Link href="/regions" className="text-gray-700 hover:text-green-600 font-medium transition-colors">
                Regions
              </Link>
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-900 font-semibold">{capitalizeRegionName(regionData.region.name)}</span>
            </nav>
          </div>
          
          {/* Content */}
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Golf Courses in {capitalizeRegionName(regionData.region.name)}
            </h1>
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              Discover golf courses across {regionData.cities.length} {regionData.cities.length === 1 ? 'city' : 'cities'} in {capitalizeRegionName(regionData.region.name)}. 
              Find and book tee times faster with TeeClub.
            </p>
          </div>
        </div>
      )}
      
      {/* Cities Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {regionData.cities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regionData.cities.map((city) => (
              <Link
                key={city.id}
                href={getCityUrl(city)}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-200 border border-gray-100 overflow-hidden flex flex-col h-full cursor-pointer group"
              >
                {/* City Image */}
                <div className="relative w-full h-40 md:h-56 lg:h-64">
                  <Image
                    src={city.image_url || '/golf-course.png'}
                    alt={city.name}
                    fill
                    className="object-cover group-hover:brightness-110 transition-all duration-200"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>

                {/* City Content */}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-green-700 transition-colors duration-200">
                    {city.name}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed flex-1">
                    Explore golf courses and find tee times in {city.name}.
                  </p>
                  
                  {/* View City Button Visual */}
                  <div className="w-full bg-green-600 group-hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2 mt-auto">
                    <span>🏌️</span>
                    View {city.name} Courses
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Region Not Found
            </h3>
            <p className="text-gray-600 mb-6">
              This region does not exist or has no cities available.
            </p>
            <Link
              href="/"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Go Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

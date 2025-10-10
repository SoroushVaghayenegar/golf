import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { fetchRegions } from '@/services/supabaseService';


export const metadata: Metadata = {
  title: 'Golf Regions | TeeClub',
  description: 'Explore golf courses across different regions with TeeClub - Canada\'s #1 tee time search platform.',
  openGraph: {
    title: 'Golf Regions | TeeClub',
    description: 'Explore golf courses across different regions with TeeClub - Canada\'s #1 tee time search platform.',
    type: 'website',
  },
};

export default async function RegionsPage() {
  const regions = await fetchRegions();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header Section */}
      <div className="relative py-16 px-6 overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-200 to-amber-100" />
        
        {/* Content */}
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Explore Golf Regions
          </h1>
          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            Discover golf courses across different regions. Find your perfect tee time in the region that suits you best.
          </p>
        </div>
      </div>
      
      {/* Regions Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {regions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regions.map((region) => (
              <div
                key={region.value}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100 overflow-hidden flex flex-col h-full"
              >
                {/* Region Image */}
                <div className="relative w-full h-48 md:h-56 lg:h-64">
                  {region.image_url ? (
                    <Image
                      src={region.image_url}
                      alt={region.label}
                      fill
                      className="object-cover transition-all duration-200"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                      <span className="text-6xl">🏌️</span>
                    </div>
                  )}
                </div>

                {/* Region Content */}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {region.label}
                  </h3>
                  {region.description && (
                    <p className="text-gray-600 mb-6 leading-relaxed flex-1">
                      {region.description}
                    </p>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 mt-auto">
                    {/* Search Tee Times Button */}
                    <Link
                      href={`/search?region=${region.value}`}
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <span>⛳</span>
                      Find Available Tee Times
                    </Link>
                    
                    {/* Explore Region Button */}
                    <Link
                      href={`/regions/${region.slug}`}
                      className="w-full bg-white hover:bg-gray-50 text-green-700 border-2 border-green-600 px-4 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <span>🏌️</span>
                      Explore {region.label}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              No Regions Found
            </h3>
            <p className="text-gray-600 mb-6">
              We&apos;re currently adding new regions. Please check back soon!
            </p>
            <Link
              href="/"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 inline-block"
            >
              Go to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}


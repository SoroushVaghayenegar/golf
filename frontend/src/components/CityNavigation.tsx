import Link from 'next/link';

export default function CityNavigation() {
  const cities = [
    { name: 'Vancouver', url: '/vancouver' },
    { name: 'Burnaby', url: '/burnaby' },
    { name: 'Surrey', url: '/surrey' },
    { name: 'Richmond', url: '/richmond' },
  ];

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <h2 className="text-center text-lg font-semibold text-gray-900 mb-4">
            Popular Golf Cities
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {cities.map((city) => (
              <Link
                key={city.name}
                href={city.url}
                className="bg-green-50 hover:bg-green-100 text-green-700 hover:text-green-800 px-6 py-3 rounded-lg font-medium transition-colors duration-200 border border-green-200 hover:border-green-300"
              >
                {city.name} Tee Times
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

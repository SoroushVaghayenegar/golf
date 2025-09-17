import { Metadata } from 'next'
import Link from 'next/link'
import CityNavigation from "@/components/CityNavigation";

export const metadata: Metadata = {
  title: 'About TeeClub - BC Golf Tee Times',
  description: 'Learn about TeeClub, BC\'s number 1 golf tee times platform. Your trusted source for finding and booking the best golf deals in British Columbia. Compare tee times across multiple courses.',
  openGraph: {
    title: 'About TeeClub - BC Golf Tee Times',
    description: 'Learn about TeeClub, BC\'s number 1 golf tee times platform. Your trusted source for finding and booking the best golf deals in British Columbia.',
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      <CityNavigation />
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">About TeeClub</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              TeeClub is Canada&apos;s leading tee time platform. The easiest way to find, compare, and book golf across Canada. We bring together tee times from multiple courses in one place, saving you time and helping you get out on the course.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-600 mb-6">
              Golf is about fresh air, community, and a challenge. Yet finding a tee time has often been harder than it should be. Our mission is connect golfers to the game, one tee time at a time. 
            </p>
            <p className="text-gray-600 mb-6">
              We believe golfers of all skill levels deserve an easy way to discover courses, connect with the game, and get out to play. TeeClub exists to make golf seamless, accessible, and connected.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Why Choose TeeClub?</h2>
            <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
              <li>Compare tee times from multiple courses in one place</li>
              <li>Find the best deals and discounts available</li>
              <li>Real-time availability updates</li>
              <li>Easy booking process</li>
              <li>Mobile-friendly interface</li>
              <li>Comprehensive BC golf course coverage</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Golf Courses</h2>
            <p className="text-gray-600 mb-6">
              We partner with golf courses throughout Canada, including public courses, semi-private clubs, and resort courses. From the scenic views of Vancouver&apos;s North Shore to the challenging layouts in the Fraser Valley, and courses across Whistler, Kelowna, Ottawa, and beyond, we help you discover the perfect course for your game.
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
              <h3 className="text-xl font-semibold text-green-900 mb-3">Ready to Book Your Tee Time?</h3>
              <p className="text-green-700 mb-4">
                Start exploring available tee times and find your perfect golf experience today.
              </p>
              <Link 
                href="/" 
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Find Tee Times
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
} 
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About T-Times Golf - Vancouver Golf Tee Times',
  description: 'Learn about T-Times Golf, your trusted source for finding and booking the best golf deals in Vancouver. Compare tee times across multiple courses.',
  openGraph: {
    title: 'About T-Times Golf - Vancouver Golf Tee Times',
    description: 'Learn about T-Times Golf, your trusted source for finding and booking the best golf deals in Vancouver.',
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">About T-Times Golf</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              T-Times Golf is your premier destination for finding and booking the best golf deals in Vancouver. 
              We aggregate tee times from multiple golf courses across the Greater Vancouver area, making it easy 
              for golfers to compare prices and find the perfect time to hit the links.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-600 mb-6">
              We believe that golf should be accessible to everyone. Our platform helps golfers discover 
              affordable tee times, compare course options, and book their next round with confidence. 
              Whether you&apos;re a seasoned pro or just starting out, we&apos;re here to help you find the perfect 
              golf experience.
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Why Choose T-Times Golf?</h2>
            <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
              <li>Compare tee times from multiple courses in one place</li>
              <li>Find the best deals and discounts available</li>
              <li>Real-time availability updates</li>
              <li>Easy booking process</li>
              <li>Mobile-friendly interface</li>
              <li>Local Vancouver golf course coverage</li>
            </ul>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Vancouver Golf Courses</h2>
            <p className="text-gray-600 mb-6">
              We partner with golf courses throughout the Greater Vancouver area, including public courses, 
              semi-private clubs, and resort courses. From the scenic views of the North Shore to the 
              challenging layouts in the Fraser Valley, we help you discover the perfect course for your game.
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
  )
} 
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact TeeClub - Get in Touch',
  description: 'Contact TeeClub for support, feedback, or questions about BC golf tee times. We&apos;re here to help you find the perfect golf experience.',
  openGraph: {
    title: 'Contact TeeClub - Get in Touch',
    description: 'Contact TeeClub for support, feedback, or questions about BC golf tee times.',
  },
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Contact Us</h1>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Get in Touch</h2>
              <p className="text-gray-600 mb-6">
                Have questions about our golf tee time service? We&apos;d love to hear from you. 
                Whether you need help finding the perfect tee time, have feedback about our service, 
                or want to partner with us, we&apos;re here to help.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Customer Support</h3>
                  <p className="text-gray-600">
                    Need help with booking or have questions about our service?
                  </p>
                  <a 
                    href="mailto:support@teeclub.golf" 
                    className="text-green-600 hover:text-green-700 font-medium"
                  >
                    support@teeclub.golf
                  </a>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">General Inquiries</h3>
                  <p className="text-gray-600">
                    For general questions or feedback about our platform.
                  </p>
                  <a 
                    href="mailto:hello@teeclub.golf" 
                    className="text-green-600 hover:text-green-700 font-medium"
                  >
                    hello@teeclub.golf
                  </a>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Partnership</h3>
                  <p className="text-gray-600">
                    Interested in partnering with us? We&apos;re always looking to work with golf courses.
                  </p>
                  <a 
                    href="mailto:partnerships@teeclub.golf" 
                    className="text-green-600 hover:text-green-700 font-medium"
                  >
                    partnerships@teeclub.golf
                  </a>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">How do I book a tee time?</h3>
                  <p className="text-gray-600">
                    Simply use our search filters to find available tee times, select your preferred 
                    date and time, and follow the booking process.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Can I cancel my booking?</h3>
                  <p className="text-gray-600">
                    Cancellation policies vary by golf course. Please check the specific course&apos;s 
                    cancellation policy when booking.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Do you offer refunds?</h3>
                  <p className="text-gray-600">
                    Refund policies are determined by individual golf courses. Contact us if you 
                    need assistance with a refund request.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Which golf courses do you work with?</h3>
                  <p className="text-gray-600">
                    We partner with golf courses throughout British Columbia. Check our 
                    homepage for current course listings.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Response Time</h2>
            <p className="text-gray-600">
              We typically respond to all inquiries within 24 hours during business days. 
              For urgent matters, please include &quot;URGENT&quot; in your email subject line.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - T-Times Golf',
  description: 'Read the terms and conditions for using T-Times Golf services. Learn about your rights and responsibilities when booking golf tee times.',
  openGraph: {
    title: 'Terms of Service - T-Times Golf',
    description: 'Read the terms and conditions for using T-Times Golf services.',
  },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600 mb-4">
                By accessing and using T-Times Golf (&quot;the Service&quot;), you accept and agree to be bound by the 
                terms and provision of this agreement. If you do not agree to abide by the above, please do 
                not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-600 mb-4">
                T-Times Golf provides an online platform for booking golf tee times at various golf courses 
                in the Vancouver area. We aggregate tee time availability and facilitate bookings between 
                users and golf courses.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
              <p className="text-gray-600 mb-4">
                To access certain features of the Service, you may be required to create an account. You are 
                responsible for maintaining the confidentiality of your account information and for all 
                activities that occur under your account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Booking and Payment</h2>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>All bookings are subject to availability at the time of booking</li>
                <li>Payment is processed at the time of booking confirmation</li>
                <li>Prices are subject to change without notice</li>
                <li>Refunds are subject to the individual golf course&apos;s cancellation policy</li>
                <li>We are not responsible for course closures due to weather or maintenance</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Cancellation Policy</h2>
              <p className="text-gray-600 mb-4">
                Cancellation policies vary by golf course. Please review the specific course&apos;s cancellation 
                policy before booking. T-Times Golf will facilitate cancellations according to each course&apos;s 
                individual policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. User Conduct</h2>
              <p className="text-gray-600 mb-4">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon the rights of others</li>
                <li>Transmit harmful, offensive, or inappropriate content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with the proper functioning of the Service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Intellectual Property</h2>
              <p className="text-gray-600 mb-4">
                The Service and its original content, features, and functionality are owned by T-Times Golf 
                and are protected by international copyright, trademark, patent, trade secret, and other 
                intellectual property laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Privacy Policy</h2>
              <p className="text-gray-600 mb-4">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your 
                use of the Service, to understand our practices.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Disclaimers</h2>
              <p className="text-gray-600 mb-4">
                The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind. We do not 
                guarantee that the Service will be uninterrupted, secure, or error-free. We are not 
                responsible for the quality of golf courses or the accuracy of course information provided 
                by third parties.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Limitation of Liability</h2>
              <p className="text-gray-600 mb-4">
                In no event shall T-Times Golf be liable for any indirect, incidental, special, consequential, 
                or punitive damages, including without limitation, loss of profits, data, use, goodwill, or 
                other intangible losses, resulting from your use of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Indemnification</h2>
              <p className="text-gray-600 mb-4">
                You agree to defend, indemnify, and hold harmless T-Times Golf from and against any claims, 
                damages, obligations, losses, liabilities, costs, or debt arising from your use of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Governing Law</h2>
              <p className="text-gray-600 mb-4">
                These Terms shall be interpreted and governed by the laws of British Columbia, Canada, 
                without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Changes to Terms</h2>
              <p className="text-gray-600 mb-4">
                We reserve the right to modify or replace these Terms at any time. If a revision is material, 
                we will provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contact Information</h2>
              <p className="text-gray-600 mb-4">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> legal@t-times.golf<br />
                  <strong>Address:</strong> [Your Business Address]<br />
                  <strong>Phone:</strong> [Your Phone Number]
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
} 
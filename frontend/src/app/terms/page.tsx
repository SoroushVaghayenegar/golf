import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - TeeClub',
  description: 'Read the terms and conditions for using TeeClub services. Learn about your rights and responsibilities when booking golf tee times.',
  openGraph: {
    title: 'Terms of Service - TeeClub',
    description: 'Read the terms and conditions for using TeeClub services.',
  },
}

export default function TermsPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Last updated: September 15, 2025</p>
          
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600 mb-4">
                By accessing and using TeeClub (the &quot;Service&quot;), you agree to be bound by these Terms of Service (the &quot;Terms&quot;). If you do not agree to these Terms, please do not use the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-600 mb-4">
                TeeClub provides users with an easy way to search, compare, and be redirected to complete bookings directly with golf courses or their third-party booking systems.
              </p>
              <p className="text-gray-600 mb-4">
                TeeClub is not a golf course, booking provider, or merchant of record. We do not process payments, set course policies, or guarantee the accuracy of third-party information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
              <p className="text-gray-600 mb-4">
                To access certain features of the Service, you may need to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Booking and Payment</h2>
              <p className="text-gray-600 mb-4">
                <strong>Redirected Bookings:</strong> All bookings are completed directly with golf courses or their third-party booking providers. TeeClub does not process or store payment information.
              </p>
              <p className="text-gray-600 mb-4">
                <strong>Merchant of Record:</strong> The golf course (or its provider) is the merchant of record for your booking.
              </p>
              <p className="text-gray-600 mb-4">
                <strong>Availability &amp; Pricing:</strong> While we strive for accuracy, TeeClub does not guarantee availability or accuracy at the time of booking.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Cancellation Policy</h2>
              <p className="text-gray-600 mb-4">
                Cancellations and refunds are subject solely to the policies of the golf course where you booked. TeeClub does not set, control, or enforce course cancellation policies.
              </p>
              <p className="text-gray-600 mb-4">
                Please review the course&apos;s cancellation policy carefully before booking.
              </p>
              <p className="text-gray-600 mb-4">
                Missed tee times or no-shows are not eligible for refunds unless the course policy specifically allows.
              </p>
              <p className="text-gray-600 mb-4">
                TeeClub&apos;s role is limited to redirecting users to course booking platforms; we do not issue refunds or credits.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. User Conduct</h2>
              <p className="text-gray-600 mb-4">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                <li>Violate any applicable laws or regulations.</li>
                <li>Infringe upon the rights of others.</li>
                <li>Transmit harmful, offensive, or inappropriate content.</li>
                <li>Attempt to gain unauthorized access to our systems.</li>
                <li>Interfere with the proper functioning of the Service.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Intellectual Property</h2>
              <p className="text-gray-600 mb-4">
                The Service and its original content, features, and functionality are owned by TeeClub and protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p className="text-gray-600 mb-4">
                You may not copy, reproduce, distribute, modify, or create derivative works from any part of the Service without our prior written consent, except where sharing features are explicitly provided (e.g. social sharing or screenshots for personal use).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Privacy Policy</h2>
              <p className="text-gray-600 mb-4">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Disclaimers</h2>
              <p className="text-gray-600 mb-4">
                The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind. Without limiting the foregoing:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                <li>TeeClub does not guarantee uninterrupted access, accuracy of tee time data, or availability of bookings.</li>
                <li>TeeClub is not responsible for errors, omissions, cancellations, or failures in course booking systems.</li>
                <li>TeeClub is not liable for course conditions, closures, weather impacts, or the quality of your golf experience.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Limitation of Liability</h2>
              <p className="text-gray-600 mb-4">
                To the maximum extent permitted by law:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                <li>TeeClub shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, goodwill, or other intangible losses.</li>
                <li>TeeClub&apos;s total liability for any claim arising out of or relating to the Service shall not exceed the amount (if any) you paid directly to TeeClub in service fees.</li>
                <li>Since payments are processed by golf courses or third-party providers, TeeClub has no liability for booking disputes, cancellations, or refunds.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Indemnification</h2>
              <p className="text-gray-600 mb-4">
                You agree to defend, indemnify, and hold harmless TeeClub from and against any claims, damages, obligations, losses, liabilities, costs, or debt arising from your use of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Governing Law</h2>
              <p className="text-gray-600 mb-4">
                These Terms shall be governed by and interpreted under the laws of British Columbia, Canada. Any disputes arising under these Terms shall be resolved exclusively in the courts of British Columbia.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Changes to Terms</h2>
              <p className="text-gray-600 mb-4">
                We may update these Terms from time to time. If material changes are made, we will notify users by email (if available) or by posting a prominent notice on our website at least 30 days before the new Terms take effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contact Information</h2>
              <p className="text-gray-600 mb-4">
                If you have questions about these Terms, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> legal@teeclub.golf
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
} 
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - TeeClub',
  description: 'Learn how TeeClub collects, uses, and protects your personal information when you use our golf tee time booking service.',
  openGraph: {
    title: 'Privacy Policy - TeeClub',
    description: 'Learn how TeeClub collects, uses, and protects your personal information.',
  },
}

export default function PrivacyPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
              <p className="text-gray-600 mb-4">
                TeeClub (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you use our website 
                and related services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Personal Information You Provide</h3>
              <p className="text-gray-600 mb-4">
                We may collect personal information that you voluntarily provide, including:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                <li>Name and contact information (email address, phone number)</li>
                <li>Golf preferences and booking history</li>
                <li>Communication preferences</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Automatically Collected Information</h3>
              <p className="text-gray-600 mb-4">
                When you visit our website, we may automatically collect:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                <li>IP address and device information</li>
                <li>Browser type and version</li>
                <li>Pages visited and time spent on pages</li>
                <li>Referring website information</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
              <p className="text-gray-600 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                <li>Facilitate your tee time search and connect you with golf course booking systems</li>
                <li>Communicate with you about your account and activity</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Improve our website and services</li>
                <li>Send you relevant offers and promotions (with your consent)</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information Sharing</h2>
              <p className="text-gray-600 mb-4">
                We do not sell, trade, or rent your personal information. We may share information in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                <li>With golf courses or booking providers: to facilitate your reservation when you choose to book</li>
                <li>With service providers: such as analytics, hosting, and email platforms that support our operations</li>
                <li>To comply with legal requirements: if required by law or valid legal request</li>
                <li>To protect rights and safety: of TeeClub, our users, or others</li>
                <li>With your consent: in cases where you explicitly authorize sharing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
              <p className="text-gray-600 mb-4">
                We use reasonable technical and organizational safeguards to protect your information. However, no method of transmission over the internet is completely secure, and we cannot guarantee absolute protection.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookies and Tracking</h2>
              <p className="text-gray-600 mb-4">
                We use cookies and similar technologies to improve your browsing experience, analyze traffic, and personalize content. Third-party providers (such as analytics and advertising partners) may also use cookies. You can manage cookies through your browser settings, though some features may not function properly without them.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Links &amp; Services</h2>
              <p className="text-gray-600 mb-4">
                TeeClub may contain links to, or integrate with, third-party websites and booking systems. If you choose to use these third-party services, your information will be governed by their privacy policies and practices, not ours.
              </p>
              <p className="text-gray-600 mb-4">
                We are not responsible for the content, policies, or practices of third-party websites or services, and we encourage you to review their privacy policies before providing any personal information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
              <p className="text-gray-600 mb-4">
                You may have the right to:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                <li>Access and review the personal information we hold about you</li>
                <li>Update or correct your information</li>
                <li>Request deletion of your information</li>
                <li>Opt out of marketing communications</li>
                <li>Withdraw consent for data processing (where applicable)</li>
              </ul>
              <p className="text-gray-600 mb-4">
                To exercise these rights, contact us at the details below.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Children&apos;s Privacy</h2>
              <p className="text-gray-600 mb-4">
                TeeClub is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe we have done so, please contact us to request deletion.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Policy</h2>
              <p className="text-gray-600 mb-4">
                We may update this Privacy Policy from time to time. When we do, we will revise the &quot;Last updated&quot; date at the top of this page. If we make material changes, we will provide notice via email (if available) or a prominent notice on our website.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-600 mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us at:
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
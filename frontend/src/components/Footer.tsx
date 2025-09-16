'use client'

import Image from 'next/image'
import Link from 'next/link'
import posthog from 'posthog-js'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const handleLinkClick = (linkName: string, href: string) => {
    posthog.capture('footer-link-clicked', { link_name: linkName, href })
  }

  const handleSocialClick = (platform: string, href: string) => {
    posthog.capture('footer-social-clicked', { platform, href })
  }

  return (
    <footer className="bg-amber-100 border-t border-amber-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-8 md:py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Logo and brand section */}
            <div className="col-span-1 md:col-span-2 lg:col-span-1">
              <Link 
                href="/" 
                className="flex items-center gap-2 mb-4"
                onClick={() => handleLinkClick('Footer Logo', '/')}
              >
                <Image 
                  src="/logo.png" 
                  alt="TeeClub" 
                  width={100} 
                  height={100} 
                  className="h-12 w-auto" 
                />
              </Link>
              <p className="text-gray-600 text-sm leading-relaxed">
              We make finding your next round effortless, so you can play more.
              </p>
            </div>

            {/* Navigation Links */}
            <div className="col-span-1">
              <h3 className="text-gray-900 font-semibold text-base mb-4">Navigation</h3>
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/cities" 
                    className="text-gray-600 hover:text-gray-900 text-sm transition-colors duration-200"
                    onClick={() => handleLinkClick('Cities', '/cities')}
                  >
                    Cities
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/about" 
                    className="text-gray-600 hover:text-gray-900 text-sm transition-colors duration-200"
                    onClick={() => handleLinkClick('About', '/about')}
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/contact" 
                    className="text-gray-600 hover:text-gray-900 text-sm transition-colors duration-200"
                    onClick={() => handleLinkClick('Contact', '/contact')}
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div className="col-span-1">
              <h3 className="text-gray-900 font-semibold text-base mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/terms" 
                    className="text-gray-600 hover:text-gray-900 text-sm transition-colors duration-200"
                    onClick={() => handleLinkClick('Terms and Conditions', '/terms')}
                  >
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/privacy" 
                    className="text-gray-600 hover:text-gray-900 text-sm transition-colors duration-200"
                    onClick={() => handleLinkClick('Privacy Policy', '/privacy')}
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Social Media */}
            <div className="col-span-1">
              <h3 className="text-gray-900 font-semibold text-base mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                <a
                  href="https://www.instagram.com/teeclub.golf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-75 transition-opacity duration-200"
                  onClick={() => handleSocialClick('Instagram', 'https://www.instagram.com/teeclub.golf')}
                  aria-label="Follow us on Instagram"
                >
                  <Image
                    src="/insta-icon.png"
                    alt="Instagram"
                    width={24}
                    height={24}
                    className="h-6 w-6"
                  />
                </a>
                <a
                  href="https://www.tiktok.com/@teeclub.golf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-75 transition-opacity duration-200"
                  onClick={() => handleSocialClick('TikTok', 'https://www.tiktok.com/@teeclub.golf')}
                  aria-label="Follow us on TikTok"
                >
                  <Image
                    src="/tiktok-icon.png"
                    alt="TikTok"
                    width={24}
                    height={24}
                    className="h-6 w-6"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright section */}
        <div className="border-t border-amber-200 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-600 text-sm">
              © {currentYear} TeeClub. All rights reserved.
            </p>
            <p className="text-gray-600 text-sm mt-2 sm:mt-0">
              Made with <span className="text-pink-500">❤️</span> for golf enthusiasts
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

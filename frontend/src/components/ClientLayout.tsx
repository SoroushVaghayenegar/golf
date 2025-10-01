'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import FeatureRequest from '@/components/FeatureRequest'
import Toaster from '@/components/ui/sonner'

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isAuthRoute = pathname?.startsWith('/auth')
  const hasFooter = pathname === '/' ||pathname === '/about' || pathname === '/privacy' || pathname === '/terms' || pathname === '/contact' || pathname === '/faq' || pathname === '/cities' || pathname.startsWith('/city/') || pathname.startsWith('/course/')
  const isNotStickyRoute = pathname === '/search' || hasFooter

  // Generate client_id on first visit
  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('client_id')) {
      let clientId: string;
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        clientId = crypto.randomUUID();
      } else {
        // Fallback for environments that don't support crypto.randomUUID()
        clientId = 'client_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
      }
      localStorage.setItem('client_id', clientId)
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      {!isAuthRoute && <Navbar variant={isNotStickyRoute ? 'home' : 'sticky'} />}
      <div className={`${isNotStickyRoute ? 'sm:pt-16' : ''}`}>
        {children}
      </div>
      {hasFooter && <Footer />}
      <FeatureRequest />
      <Toaster />
    </div>
  )
}



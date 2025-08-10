'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import Navbar from '@/components/Navbar'
import FeatureRequest from '@/components/FeatureRequest'
import Toaster from '@/components/ui/sonner'

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isAuthRoute = pathname?.startsWith('/auth')

  return (
    <>
      {!isAuthRoute && <Navbar />}
      <div className={!isAuthRoute ? 'pt-16' : ''}>
        {children}
      </div>
      <FeatureRequest />
      <Toaster />
    </>
  )
}



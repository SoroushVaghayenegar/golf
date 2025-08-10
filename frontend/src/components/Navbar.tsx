'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import posthog from 'posthog-js'
import UserDropdown from '@/components/UserDropdown'

export default function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      setIsAuthenticated(!!data.user)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full bg-amber-100 backdrop-blur border-b border-amber-200">
      <div className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2" onClick={() => posthog.capture('navbar-logo-clicked')}>
          <Image src="/logo.png" alt="TeeClub" width={100} height={100} className="h-10 w-auto" />
        </Link>

        {isAuthenticated ? (
          <UserDropdown />
        ) : (
          <div className="flex items-center gap-3 text-sm">
            <Link href="/auth/request-invite" className="hover:underline" onClick={() => posthog.capture('navbar-signup-clicked')}>Waitlist</Link>
            <span className="text-gray-600">|</span>
            <Link href="/auth/login" className="hover:underline" onClick={() => posthog.capture('navbar-login-clicked')}>Login</Link>
          </div>
        )}
      </div>
    </nav>
  )
}

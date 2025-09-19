'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import posthog from 'posthog-js'
import { LogIn } from 'lucide-react'
import UserDropdown from '@/components/UserDropdown'

type NavbarProps = {
  variant?: 'home' | 'sticky'
}

export default function Navbar({ variant = 'home' }: NavbarProps) {
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

  const wrapperClass = variant === 'home' ? 'py-1 lg:py-0 bg-slate-100' : 'bg-slate-100'
  const navClass =
    variant === 'home'
      ? 'z-50 bg-amber-100 backdrop-blur border-amber-200 mx-3 mt-3 rounded-2xl border shadow-sm sm:mx-0 sm:mt-0 sm:fixed sm:left-0 sm:right-0 sm:top-0 sm:rounded-none sm:border-none sm:border-b'
      : 'sticky top-0 z-50 bg-amber-100 backdrop-blur border-amber-200 border-b shadow-sm'

  return (
    <div className={wrapperClass}>
      <nav className={navClass}>
        <div className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2" onClick={() => posthog.capture('navbar-logo-clicked')}>
            <Image src="/logo.png" alt="TeeClub" width={100} height={100} className="h-10 w-auto" />
          </Link>

          {isAuthenticated ? (
            <UserDropdown />
          ) : (
            <div className="flex items-center gap-3 text-sm">
              <Link href="/auth/sign-up" className="hover:underline" onClick={() => posthog.capture('navbar-signup-clicked')}>Sign up</Link>
              <span className="text-gray-600">|</span>
              <Link 
                href="/auth/login" 
                className="bg-[#166534] text-white px-4 py-2 rounded-lg hover:bg-[#15803d] transition-colors duration-200 font-medium flex items-center gap-2" 
                onClick={() => posthog.capture('navbar-login-clicked')}
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
            </div>
          )}
        </div>
      </nav>
    </div>
  )
}

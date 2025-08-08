'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LogoutButton } from '@/components/logout-button'

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
    <nav className="sticky top-0 z-50 w-full bg-amber-200 backdrop-blur rounded-2xl lg:rounded-none">
      <div className="flex items-center justify-between py-3 px-5 lg:px-12">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="TeeClub" width={100} height={100} />
        </Link>

        {isAuthenticated ? (
          <LogoutButton />
        ) : (
          <div className="flex items-center gap-3 text-sm">
            <Link href="/auth/sign-up" className="hover:underline">Sign up</Link>
            <span className="text-gray-600">|</span>
            <Link href="/auth/login" className="hover:underline">Login</Link>
          </div>
        )}
      </div>
    </nav>
  )
}



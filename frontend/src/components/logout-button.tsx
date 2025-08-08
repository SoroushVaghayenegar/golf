'use client'

import posthog from 'posthog-js'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  const logout = async () => {
    const supabase = createClient()
    posthog.capture('user-logged-out')
    await supabase.auth.signOut()
    posthog.reset()
    router.push('/')
  }

  return <Button onClick={logout}>Logout</Button>
}

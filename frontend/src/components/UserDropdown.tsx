'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import posthog from 'posthog-js'
import { Menu } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CurrentUserAvatar } from '@/components/current-user-avatar'
import { useCurrentUserName } from '@/hooks/use-current-user-name'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function UserDropdown() {
  const router = useRouter()
  const name = useCurrentUserName()

  const handleLogout = async (): Promise<void> => {
    const supabase = createClient()
    posthog.capture('user-logged-out')
    await supabase.auth.signOut()
    posthog.reset()
    router.push('/')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Open menu"
          variant="ghost"
          size="lg"
          className="px-4 py-4 bg-amber-100 hover:bg-amber-200 focus-visible:ring-0 focus-visible:border-transparent"
        >
          <Menu className="size-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 text-base">
        <div className="flex items-center gap-3 px-3 py-3">
          <CurrentUserAvatar />
          <div className="flex flex-col">
            <span className="text-base font-medium leading-none">{name}</span>
          </div>
        </div>
        <DropdownMenuSeparator />

        <DropdownMenuItem className="py-3" asChild>
          <Link href="/tee-time-watchlist">Tee Time Watchlist</Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="py-3"
          variant="destructive"
          onSelect={(event) => {
            event.preventDefault()
            void handleLogout()
          }}
        >
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}



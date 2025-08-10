'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import posthog from 'posthog-js'
import { MenuIcon } from 'lucide-react'

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
          size="sm"
          className="px-3 bg-amber-100 hover:bg-amber-200 focus-visible:ring-0 focus-visible:border-transparent"
        >
          <MenuIcon className="md:hidden" />
          <span className="hidden md:inline">Menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center gap-3 px-2 py-2">
          <CurrentUserAvatar />
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-none">{name}</span>
          </div>
        </div>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/tee-time-watchlist">Tee Time Watchlist</Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem
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



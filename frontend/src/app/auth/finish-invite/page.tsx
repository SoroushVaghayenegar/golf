'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const supabase = createClient()

  // Require session
  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.replace('/auth/callback')
        return
      }
      const meta = data.session.user.user_metadata as { first_name?: string; last_name?: string }
      if (meta?.first_name) setFirstName(meta.first_name)
      if (meta?.last_name) setLastName(meta.last_name)
      setReady(true)
    }
    check()
  }, [router, supabase])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required.')
      return
    }
    if (pwd.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (pwd !== pwd2) {
      setError('Passwords do not match.')
      return
    }

    setBusy(true)
    const { error } = await supabase.auth.updateUser({
      password: pwd,
      data: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      },
    })
    setBusy(false)

    if (error) {
      setError(error.message)
      return
    }

    router.replace('/')
  }

  if (!ready)
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex justify-center">
            <Image src="/logo.png" alt="Golf logo" width={120} height={120} priority />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Loading…</CardTitle>
              <CardDescription>Please wait</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Image src="/logo.png" alt="Golf logo" width={120} height={120} priority />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Finish account setup</CardTitle>
            <CardDescription>Set your password and confirm your details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit}>
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    required
                    value={pwd2}
                    onChange={(e) => setPwd2(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? 'Saving…' : 'Save password'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

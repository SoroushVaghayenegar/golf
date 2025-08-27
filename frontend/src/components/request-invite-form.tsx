'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'


export function RequestInviteForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleRequestInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await createClient()
        .from('signup_invites')
        .insert({email})

      if (error) throw error
      setSuccess(true)
    } catch (error: unknown) {
        if(error instanceof Object && 'message' in error && typeof error.message === 'string' && error.message.includes('duplicate key value')) {
        setError("You're already on the waitlist!")
      } else {
        setError(error instanceof Error ? error.message : 'An error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-10', className)} {...props}>
      {success ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Thank you!</CardTitle>
            <CardDescription>We&apos;ll add you to the waitlist.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
            Don&apos;t worry—we&apos;ll send you an email when it&apos;s your time to join.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Request an Invite</CardTitle>
            <CardDescription>
              Type in your email and we&apos;ll add you to the <span className='font-bold'>waitlist</span>.
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 flex items-center gap-2">
                  📧 <span>To ensure you receive our invite, please whitelist <span className="font-semibold">@teeclub.golf</span></span>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="link" className="h-auto p-0 text-blue-600 underline text-sm">
                        How?
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>📧 Whitelist Instructions</DialogTitle>
                        <DialogDescription>
                          Follow these steps to ensure you receive all our emails
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 text-sm">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-gray-900">Gmail / Google Workspace:</h4>
                          <ol className="list-decimal list-inside space-y-1 text-gray-700 ml-2">
                            <li>Open Gmail → click the ⚙️ gear icon → See all settings</li>
                            <li>Go to Filters and Blocked Addresses → Create a new filter</li>
                            <li>In the From field, enter: <code className="bg-gray-100 px-1 rounded">@teeclub.golf</code></li>
                            <li>Click Create filter</li>
                            <li>Check &quot;Never send it to Spam&quot; → Create filter</li>
                          </ol>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-semibold text-gray-900">Outlook / Office 365/ Hotmail:</h4>
                          <ol className="list-decimal list-inside space-y-1 text-gray-700 ml-2">
                            <li>Go to Settings → Mail → Junk Email</li>
                            <li>Under &quot;Safe senders and domains&quot;, click Add</li>
                            <li>Type: <code className="bg-gray-100 px-1 rounded">teeclub.golf</code></li>
                          </ol>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-semibold text-gray-900">Yahoo Mail:</h4>
                          <ol className="list-decimal list-inside space-y-1 text-gray-700 ml-2">
                            <li>Sign in and go to Settings ⚙️ → More Settings</li>
                            <li>Select Filters → Add new filter</li>
                            <li>Enter a name (e.g. &quot;Safe senders&quot;)</li>
                            <li>In the From field type: <code className="bg-gray-100 px-1 rounded">@teeclub.golf</code></li>
                            <li>Choose Inbox as the folder, then click Save</li>
                          </ol>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-semibold text-gray-900">Apple Mail:</h4>
                          <ol className="list-decimal list-inside space-y-1 text-gray-700 ml-2">
                            <li>Open an email from us</li>
                            <li>Click the sender&apos;s name → Add to Contacts</li>
                          </ol>
                        </div>
                        
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-green-800 font-medium text-center">
                            👉 In all cases, add <code className="bg-green-100 px-1 rounded">@teeclub.golf</code> to your safe sender list
                          </p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </p>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRequestInvite}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Request Invite'}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Already have an account?{' '}
                <Link href="/auth/login" className="underline underline-offset-4">
                  Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

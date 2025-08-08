import Image from 'next/image'
import Link from 'next/link'
import { RequestInviteForm } from '@/components/request-invite-form'

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Link href="/" aria-label="Home">
            <Image src="/logo.png" alt="Golf logo" width={120} height={120} priority />
          </Link>
        </div>
        <RequestInviteForm />
      </div>
    </div>
  )
}

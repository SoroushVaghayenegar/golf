import { Metadata } from 'next'
import FAQClient from './FAQClient'

export const metadata: Metadata = {
  title: 'FAQ - TeeClub Golf | Vancouver Tee Times',
  description: 'Frequently asked questions about golf courses in Vancouver, tee time bookings, and more. Find answers to common questions about BC golf.',
  openGraph: {
    title: 'FAQ - TeeClub Golf | Vancouver Tee Times',
    description: 'Frequently asked questions about golf courses in Vancouver, tee time bookings, and more.',
  },
}

export default function FAQPage() {
  return <FAQClient />
}

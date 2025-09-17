import type { Metadata } from "next";
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: "Burnaby Tee Times | Golf Courses in Burnaby BC",
  description: "Find and book Burnaby golf tee times. Discover golf courses in Burnaby, BC with real-time availability and competitive pricing.",
  keywords: "Burnaby golf, Burnaby tee times, Burnaby golf courses, BC golf courses, golf booking Burnaby",
  openGraph: {
    title: "Burnaby Tee Times | Golf Courses in Burnaby BC",
    description: "Find and book Burnaby golf tee times. Discover golf courses in Burnaby, BC with real-time availability and competitive pricing.",
    url: 'https://teeclub.golf/burnaby',
    siteName: 'TeeClub',
    images: [
      {
        url: '/bg1.png',
        width: 1200,
        height: 630,
        alt: 'Burnaby Golf Courses - TeeClub',
      },
    ],
    locale: 'en_CA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Burnaby Tee Times | Golf Courses in Burnaby BC",
    description: "Find and book Burnaby golf tee times. Discover golf courses in Burnaby, BC with real-time availability.",
    images: ['/bg1.png'],
  },
  alternates: {
    canonical: '/burnaby',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BurnabyPage() {
  // Get tomorrow's date in Vancouver timezone
  const getTomorrowDate = () => {
    const now = new Date();
    const vancouverTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Vancouver"}));
    vancouverTime.setDate(vancouverTime.getDate() + 1);
    return vancouverTime.toISOString().split('T')[0];
  };

  // Redirect to search page with tomorrow's date and Burnaby filter
  redirect(`/search?dates=${getTomorrowDate()}&cities=Burnaby&region=1`);
}

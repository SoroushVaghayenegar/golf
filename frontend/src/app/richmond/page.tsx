import type { Metadata } from "next";
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: "Richmond Tee Times | Golf Courses in Richmond BC",
  description: "Find and book Richmond golf tee times. Discover golf courses in Richmond, BC with real-time availability and competitive pricing.",
  keywords: "Richmond golf, Richmond tee times, Richmond golf courses, BC golf courses, golf booking Richmond",
  openGraph: {
    title: "Richmond Tee Times | Golf Courses in Richmond BC",
    description: "Find and book Richmond golf tee times. Discover golf courses in Richmond, BC with real-time availability and competitive pricing.",
    url: 'https://teeclub.golf/richmond',
    siteName: 'TeeClub',
    images: [
      {
        url: '/bg1.png',
        width: 1200,
        height: 630,
        alt: 'Richmond Golf Courses - TeeClub',
      },
    ],
    locale: 'en_CA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Richmond Tee Times | Golf Courses in Richmond BC",
    description: "Find and book Richmond golf tee times. Discover golf courses in Richmond, BC with real-time availability.",
    images: ['/bg1.png'],
  },
  alternates: {
    canonical: '/richmond',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RichmondPage() {
  // Get tomorrow's date in Vancouver timezone
  const getTomorrowDate = () => {
    const now = new Date();
    const vancouverTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Vancouver"}));
    vancouverTime.setDate(vancouverTime.getDate() + 1);
    return vancouverTime.toISOString().split('T')[0];
  };

  // Redirect to search page with tomorrow's date and Richmond filter
  redirect(`/search?dates=${getTomorrowDate()}&cities=Richmond&region=1`);
}

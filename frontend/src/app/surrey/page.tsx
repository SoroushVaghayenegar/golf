import type { Metadata } from "next";
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: "Surrey Tee Times | Golf Courses in Surrey BC",
  description: "Find and book Surrey golf tee times. Discover golf courses in Surrey, BC with real-time availability and competitive pricing.",
  keywords: "Surrey golf, Surrey tee times, Surrey golf courses, BC golf courses, golf booking Surrey",
  openGraph: {
    title: "Surrey Tee Times | Golf Courses in Surrey BC",
    description: "Find and book Surrey golf tee times. Discover golf courses in Surrey, BC with real-time availability and competitive pricing.",
    url: 'https://teeclub.golf/surrey',
    siteName: 'TeeClub',
    images: [
      {
        url: '/bg1.png',
        width: 1200,
        height: 630,
        alt: 'Surrey Golf Courses - TeeClub',
      },
    ],
    locale: 'en_CA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Surrey Tee Times | Golf Courses in Surrey BC",
    description: "Find and book Surrey golf tee times. Discover golf courses in Surrey, BC with real-time availability.",
    images: ['/bg1.png'],
  },
  alternates: {
    canonical: '/surrey',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SurreyPage() {
  // Get tomorrow's date in Vancouver timezone
  const getTomorrowDate = () => {
    const now = new Date();
    const vancouverTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Vancouver"}));
    vancouverTime.setDate(vancouverTime.getDate() + 1);
    return vancouverTime.toISOString().split('T')[0];
  };

  // Redirect to search page with tomorrow's date and Surrey filter
  redirect(`/search?dates=${getTomorrowDate()}&cities=Surrey&region=1`);
}

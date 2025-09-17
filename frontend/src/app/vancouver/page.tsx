import type { Metadata } from "next";
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: "Vancouver Tee Times | Golf Courses in Vancouver BC",
  description: "Find and book Vancouver golf tee times at Fraserview, Langara, McCleery, University Golf Club, and Musqueam. Compare prices and availability across Vancouver's top golf courses.",
  keywords: "Vancouver golf, Vancouver tee times, Fraserview golf course, Langara golf course, McCleery golf course, University Golf Club, Musqueam golf, Vancouver golf booking, BC golf courses",
  openGraph: {
    title: "Vancouver Tee Times | Golf Courses in Vancouver BC",
    description: "Find and book Vancouver golf tee times at Fraserview, Langara, McCleery, University Golf Club, and Musqueam. Compare prices and availability across Vancouver's top golf courses.",
    url: 'https://teeclub.golf/vancouver',
    siteName: 'TeeClub',
    images: [
      {
        url: '/Fraserview.png',
        width: 1200,
        height: 630,
        alt: 'Vancouver Golf Courses - TeeClub',
      },
    ],
    locale: 'en_CA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Vancouver Tee Times | Golf Courses in Vancouver BC",
    description: "Find and book Vancouver golf tee times at Fraserview, Langara, McCleery, University Golf Club, and Musqueam.",
    images: ['/Fraserview.png'],
  },
  alternates: {
    canonical: '/vancouver',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function VancouverPage() {
  // Get tomorrow's date in Vancouver timezone
  const getTomorrowDate = () => {
    const now = new Date();
    const vancouverTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Vancouver"}));
    vancouverTime.setDate(vancouverTime.getDate() + 1);
    return vancouverTime.toISOString().split('T')[0];
  };

  // Redirect to search page with tomorrow's date and Vancouver filter
  redirect(`/search?dates=${getTomorrowDate()}&cities=Vancouver&region=1`);
}

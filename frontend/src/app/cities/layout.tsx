import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Vancouver Golf Tee Times | Book Multiple Courses in One Place',
  description: 'Find Vancouver golf tee times across Fraserview, Langara, McCleery, University & more. Search multiple courses at once and book faster with TeeClub.',
  keywords: 'Vancouver golf, golf tee times Vancouver, Fraserview golf course, Langara golf course, McCleery golf course, University Golf Club, Musqueam golf, Vancouver golf booking, BC golf courses, golf Vancouver BC',
  openGraph: {
    title: 'Vancouver Golf Tee Times | Book Multiple Courses in One Place',
    description: 'Find Vancouver golf tee times across Fraserview, Langara, McCleery, University & more. Search multiple courses at once and book faster with TeeClub.',
    url: 'https://teeclub.golf/cities',
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
    title: 'Vancouver Golf Tee Times | Book Multiple Courses in One Place',
    description: 'Find Vancouver golf tee times across Fraserview, Langara, McCleery, University & more. Search multiple courses at once and book faster with TeeClub.',
    images: ['/Fraserview.png'],
  },
  alternates: {
    canonical: '/cities',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function CitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

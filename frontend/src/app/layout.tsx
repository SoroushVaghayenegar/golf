import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TeeClub - #1 Tee Times finder in North America",
  description: "BC's number 1 golf tee times platform. Discover the best golf deals across British Columbia and Canada. Compare tee times across multiple courses, find discounts, and book your next round. Real-time availability for golf courses.",
  keywords: "golf, tee times, golf booking, golf courses, golf deals, golf discounts, driving range, country clubs, golf reservations, golf packages, golf tournaments, golf memberships, golf lessons, golf clubs, golf equipment, golf pro shop, golf simulator, mini golf, putting green, golf cart, caddie, golf instruction, golf clinics, Canada, British Columbia, BC, Vancouver, Toronto, Montreal, Calgary, Ottawa, Edmonton, Winnipeg, Quebec City, Hamilton, Kitchener, London, Halifax, Victoria, Saskatoon, Regina, Windsor, Sherbrooke, St. John's, Barrie, Kelowna, Abbotsford, Kingston, Trois-Rivières, golf course booking, tee time reservations, Canadian golf, BC golf, golf deals Canada, golf courses Canada",
  authors: [{ name: "TeeClub" }],
  creator: "TeeClub",
  publisher: "TeeClub",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://teeclub.golf'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "TeeClub - #1 Tee Times finder in North America",
    description: "BC's number 1 golf tee times platform. Discover the best golf deals across British Columbia and Canada. Compare tee times across multiple courses, find discounts, and book your next round.",
    url: 'https://teeclub.golf',
    siteName: 'TeeClub',
    images: [
      {
        url: '/golf-course.png',
        width: 1200,
        height: 630,
        alt: 'BC Golf Course - TeeClub',
      },
    ],
    locale: 'en_CA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "TeeClub - #1 Tee Times finder in North America",
    description: "BC's number 1 golf tee times platform. Discover the best golf deals across British Columbia and Canada.",
    images: ['/golf-course.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: "/favicon-1.ico",
    apple: "/favicon-1.ico",
  },
  themeColor: "#000000",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#000000" />
        <meta name="msapplication-TileColor" content="#000000" />
        <link rel="apple-touch-icon" href="/favicon-1.ico" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "TeeClub",
              "description": "BC's number 1 golf tee times platform. Find and book tee times for golf courses across British Columbia and Canada",
              "url": "https://teeclub.golf",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://teeclub.golf/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

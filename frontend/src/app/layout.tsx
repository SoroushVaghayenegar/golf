import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next"
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
  title: "Vancouver Tee Times - Find Golf Deals & Book Tee Times",
  description: "Discover the best golf deals in Vancouver. Compare tee times across multiple courses, find discounts, and book your next round. Real-time availability for Vancouver golf courses.",
  keywords: "Vancouver golf, tee times, golf deals, golf courses Vancouver, golf booking, golf discounts, golf Vancouver BC",
  authors: [{ name: "T-Times Golf" }],
  creator: "T-Times Golf",
  publisher: "T-Times Golf",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://t-times.golf'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Vancouver Tee Times - Find Golf Deals & Book Tee Times",
    description: "Discover the best golf deals in Vancouver. Compare tee times across multiple courses, find discounts, and book your next round.",
    url: 'https://t-times.golf',
    siteName: 'T-Times Golf',
    images: [
      {
        url: '/golf-course.png',
        width: 1200,
        height: 630,
        alt: 'Vancouver Golf Course',
      },
    ],
    locale: 'en_CA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Vancouver Tee Times - Find Golf Deals & Book Tee Times",
    description: "Discover the best golf deals in Vancouver. Compare tee times across multiple courses.",
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
              "name": "T-Times Golf",
              "description": "Find and book tee times for golf courses in Vancouver",
              "url": "https://t-times.golf",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://t-times.golf/search?q={search_term_string}",
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
      </body>
    </html>
  );
}

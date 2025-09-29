import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import { GoogleTagManager } from '@next/third-parties/google';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TeeClub - #1 Tee Times finder in Canada",
  description: "Canada's number 1 golf tee times platform. Discover the best golf deals across Canada. Compare tee times across multiple courses, find discounts, and book your next round. Real-time availability for golf courses.",
  keywords: "golf, tee times, golf booking, golf courses, golf deals, Canadian golf, BC golf, golf reservations, golf course search, tee time search",
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
    title: "TeeClub - #1 Tee Times finder in Canada",
    description: "Canada's number 1 golf tee times platform. Discover the best golf deals across Canada. Compare tee times across multiple courses, find discounts, and book your next round.",
    url: 'https://teeclub.golf',
    siteName: 'TeeClub',
    images: [
      {
        url: '/bg1.png?v=2',
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
    title: "TeeClub - #1 Tee Times finder in Canada",
    description: "Canada's number 1 golf tee times platform. Discover the best golf deals across Canada.",
    images: ['/bg1.png?v=2'],
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
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    apple: "/apple-touch-icon.png",
  },
  themeColor: "#000000",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content",
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
        <link rel="apple-touch-icon" href="/favicon.ico" />
        
        {/* Performance optimizations - preload critical resources */}
        <link rel="preload" href="https://fonts.gstatic.com/s/geist/v1/UcC63EosKnWM0x7Lg0VpvFVzNQl5QFBd6hgz1bS9kNQh7yWV.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/bg1.png" as="image" />
        
        {/* Hreflang for international SEO */}
        <link rel="alternate" href="https://teeclub.golf" hrefLang="en-ca" />
        <link rel="alternate" href="https://teeclub.golf" hrefLang="en-us" />
        <link rel="alternate" href="https://teeclub.golf" hrefLang="en" />
        <link rel="alternate" href="https://teeclub.golf" hrefLang="x-default" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "TeeClub",
              "description": "Canada's number 1 golf tee times platform. Find and book tee times for golf courses across Canada",
              "url": "https://teeclub.golf",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://teeclub.golf/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "mainEntity": {
                "@type": "ItemList",
                "name": "City Golf Pages",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Vancouver Tee Times",
                    "url": "https://teeclub.golf/vancouver"
                  },
                  {
                    "@type": "ListItem", 
                    "position": 2,
                    "name": "Burnaby Tee Times",
                    "url": "https://teeclub.golf/burnaby"
                  },
                  {
                    "@type": "ListItem",
                    "position": 3, 
                    "name": "Surrey Tee Times",
                    "url": "https://teeclub.golf/surrey"
                  },
                  {
                    "@type": "ListItem",
                    "position": 4,
                    "name": "Richmond Tee Times", 
                    "url": "https://teeclub.golf/richmond"
                  }
                ]
              }
            })
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-blue-50 to-slate-100`}
      >
        <ClientLayout>{children}</ClientLayout>
        <Analytics />
        <SpeedInsights />
        <GoogleTagManager gtmId="AW-17542978904" />
      </body>
    </html>
  );
}

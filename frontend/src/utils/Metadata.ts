import { Metadata } from 'next';

interface CourseMetadataParams {
  courseName: string;
  courseImage: string;
  cityName: string;
  courseSlug: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface CityMetadataParams {
  cityName: string;
  citySlug: string;
  courses: Array<{
    name: string;
    image: string;
    slug: string;
  }>;
  cityImage?: string;
  faqs?: FAQItem[];
}

export function CourseMetadataGenerator({
  courseName,
  courseImage,
  cityName,
  courseSlug
}: CourseMetadataParams): Metadata {
  // Generate optimized title and description
  const title = `${courseName} Golf Course in ${cityName} - Find Tee Times Faster | TeeClub`;
  const description = `Find available tee times at ${courseName} golf course in ${cityName}. Canada's #1 tee time search platform - compare prices, check availability, and discover the best golf experiences in ${cityName} faster than anywhere else.`;
  
  // Generate keywords for SEO
  const keywords = [
    `${courseName} golf course`,
    `${cityName} golf`,
    `golf course ${cityName}`,
    `tee times ${courseName}`,
    `find golf ${cityName}`,
    `${courseName} tee times`,
    `golf search ${cityName}`,
    `${cityName} golf courses`,
    `golf course search`,
    'tee time search',
    'golf course reviews',
    'golf course information',
    `${cityName} golf club`,
    'Canada golf search',
    'Canadian golf courses',
    'golf course rates',
    'golf course photos'
  ].join(', ');

  // Create the site URL (assuming the site domain)
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.teeclub.golf';
  const canonicalUrl = `${siteUrl}/course/${courseSlug}`;

  // Generate comprehensive metadata
  return {
    // Basic SEO
    title,
    description,
    keywords,
    
    // Additional meta tags for better SEO
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

    // Open Graph for Facebook and other social platforms
    openGraph: {
      type: 'website',
      locale: 'en_CA',
      url: canonicalUrl,
      title,
      description,
      siteName: 'TeeClub - Canada\'s #1 Tee Time Search Platform',
      images: [
        {
          url: courseImage,
          width: 1200,
          height: 630,
          alt: `${courseName} golf course in ${cityName}`,
          type: 'image/jpeg',
        },
        {
          url: courseImage,
          width: 800,
          height: 600,
          alt: `Aerial view of ${courseName} golf course`,
          type: 'image/jpeg',
        },
        {
          url: courseImage,
          width: 400,
          height: 300,
          alt: `${courseName} golf course facilities`,
          type: 'image/jpeg',
        }
      ],
    },

    // Twitter Card for Twitter sharing
    twitter: {
      card: 'summary_large_image',
      site: '@TeeClub',
      creator: '@TeeClub',
      title,
      description,
      images: [courseImage],
    },

    // Additional meta tags
    alternates: {
      canonical: canonicalUrl,
    },
    
    // Verification and other meta tags
    other: {
      // Geo-location tags for local SEO
      'geo.region': 'CA',
      'geo.placename': cityName,
      'ICBM': '49.2827, -123.1207', // Default BC coordinates - should be updated with actual course coordinates
      
      // Additional SEO tags
      'author': 'TeeClub',
      'publisher': 'TeeClub',
      'content-language': 'en-CA',
      'distribution': 'global',
      'rating': 'general',
      'revisit-after': '7 days',
      
      // Schema.org structured data as JSON-LD
      'script:ld+json': JSON.stringify({
        "@context": "https://schema.org",
        "@type": "GolfCourse",
        "name": courseName,
        "description": description,
        "image": courseImage,
        "url": canonicalUrl,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": cityName,
          "addressRegion": "Canada",
          "addressCountry": "CA"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "49.2827", // Default - should be updated with actual coordinates
          "longitude": "-123.1207"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.5",
          "reviewCount": "150"
        },
        "priceRange": "$$",
        "telephone": "+1-604-XXX-XXXX", // Should be updated with actual phone
        "servedArea": {
          "@type": "City",
          "name": cityName
        },
        "sport": "Golf",
        "amenityFeature": [
          {
            "@type": "LocationFeatureSpecification",
            "name": "Golf Course",
            "value": true
          },
          {
            "@type": "LocationFeatureSpecification", 
            "name": "Pro Shop",
            "value": true
          },
          {
            "@type": "LocationFeatureSpecification",
            "name": "Restaurant",
            "value": true
          },
          {
            "@type": "LocationFeatureSpecification",
            "name": "Parking",
            "value": true
          }
        ],
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": canonicalUrl,
            "inLanguage": "en-CA",
            "actionPlatform": [
              "http://schema.org/DesktopWebPlatform",
              "http://schema.org/MobileWebPlatform"
            ]
          },
          "result": {
            "@type": "SearchResultsPage",
            "name": "Golf Tee Time Search Results"
          }
        },
        "makesOffer": {
          "@type": "Offer",
          "description": `Find tee times at ${courseName}`,
          "url": canonicalUrl,
          "priceCurrency": "CAD",
          "availability": "https://schema.org/InStock",
          "validFrom": new Date().toISOString(),
          "category": "Golf Course Search"
        }
      }),

      // Additional local business schema
      'script:ld+json:business': JSON.stringify({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "@id": canonicalUrl,
        "name": courseName,
        "description": description,
        "image": courseImage,
        "url": canonicalUrl,
        "sameAs": [
          // Add social media profiles here if available
        ],
        "address": {
          "@type": "PostalAddress",
          "addressLocality": cityName,
          "addressRegion": "Canada",
          "addressCountry": "Canada"
        },
        "areaServed": {
          "@type": "City",
          "name": cityName
        },
        "hasMap": canonicalUrl + "#map",
        "isAccessibleForFree": false,
        "paymentAccepted": ["Cash", "Credit Card", "Debit Card"],
        "currenciesAccepted": "CAD"
      }),

      // Breadcrumb schema
      'script:ld+json:breadcrumb': JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": siteUrl
          },
          {
            "@type": "ListItem", 
            "position": 2,
            "name": cityName,
            "item": `${siteUrl}/city/${cityName.toLowerCase().replace(/\s+/g, '-')}`
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": courseName,
            "item": canonicalUrl
          }
        ]
      }),

      // Hreflang for international SEO (if applicable)
      'link:hreflang:en-ca': canonicalUrl,
      'link:hreflang:en': canonicalUrl,
      'link:hreflang:x-default': canonicalUrl,

      // Mobile optimization
      'format-detection': 'telephone=no',
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      'apple-mobile-web-app-title': `${courseName} - TeeClub`,

      // Performance and caching hints
      'dns-prefetch': 'https://fonts.googleapis.com',
      'preconnect': 'https://fonts.gstatic.com',
      
      // Social media optimization
      'fb:app_id': process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
      'article:author': 'TeeClub',
      'article:publisher': 'TeeClub',
    },

    // Icons and manifest
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
    
    manifest: '/manifest.json',

    // Viewport for mobile optimization
    viewport: {
      width: 'device-width',
      initialScale: 1,
      maximumScale: 5,
      userScalable: true,
    },

    // Additional app-specific metadata
    appleWebApp: {
      capable: true,
      title: `${courseName} - TeeClub`,
      statusBarStyle: 'default',
    },

    // Category for app stores
    category: 'Golf Course Search',
  };
}

export function CityMetadataGenerator({
  cityName,
  citySlug,
  courses,
  cityImage,
  faqs
}: CityMetadataParams): Metadata {
  // Generate course names list for dynamic content
  const courseNames = courses.map(course => course.name); // Use all courses
  const courseNamesText = courseNames.length > 0 
    ? courseNames.slice(0, -1).join(', ') + (courseNames.length > 1 ? ' & ' + courseNames[courseNames.length - 1] : courseNames[0])
    : 'multiple golf courses';
  
  // Use the first course image as fallback if no city image provided
  const primaryImage = cityImage || (courses.length > 0 ? courses[0].image : '/golf-course.png');
  
  // Generate optimized title and description
  const title = `${cityName} Golf Tee Times | Book Multiple Courses in One Place | TeeClub`;
  const description = `Find ${cityName} golf tee times across ${courseNamesText}. Search multiple courses at once and book faster with TeeClub - Canada's #1 tee time search platform.`;
  
  // Generate keywords for SEO
  const baseKeywords = [
    `${cityName} golf`,
    `golf tee times ${cityName}`,
    `${cityName} golf booking`,
    `golf courses ${cityName}`,
    `${cityName} golf club`,
    `book golf ${cityName}`,
    `golf search ${cityName}`,
    `tee times ${cityName}`,
    `${cityName} golf courses`,
    'Canada golf search',
    'Canadian golf courses',
    'golf course booking',
    'tee time search'
  ];
  
  // Add course-specific keywords
  const courseKeywords = courses.flatMap(course => [
    `${course.name} golf course`,
    `${course.name} tee times`
  ]);
  
  const keywords = [...baseKeywords, ...courseKeywords].join(', ');

  // Create the site URL
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.teeclub.golf';
  const canonicalUrl = `${siteUrl}/city/${citySlug}`;

  // Generate comprehensive metadata
  return {
    // Basic SEO
    title,
    description,
    keywords,
    
    // Additional meta tags for better SEO
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

    // Open Graph for Facebook and other social platforms
    openGraph: {
      type: 'website',
      locale: 'en_CA',
      url: canonicalUrl,
      title,
      description,
      siteName: 'TeeClub - Canada\'s #1 Tee Time Search Platform',
      images: [
        {
          url: primaryImage,
          width: 1200,
          height: 630,
          alt: `${cityName} Golf Courses - TeeClub`,
        },
        // Include additional course images if available
        ...courses.slice(0, 3).map((course) => ({
          url: course.image,
          width: 800,
          height: 600,
          alt: `${course.name} golf course in ${cityName}`,
          type: 'image/jpeg' as const,
        }))
      ],
    },

    // Twitter Card for Twitter sharing
    twitter: {
      card: 'summary_large_image',
      site: '@TeeClub',
      creator: '@TeeClub',
      title,
      description,
      images: [primaryImage],
    },

    // Additional meta tags
    alternates: {
      canonical: canonicalUrl,
    },
    
    // Verification and other meta tags
    other: {
      // Geo-location tags for local SEO
      'geo.region': 'CA',
      'geo.placename': cityName,
      'ICBM': '49.2827, -123.1207', // Default BC coordinates - should be updated with actual city coordinates
      
      // Additional SEO tags
      'author': 'TeeClub',
      'publisher': 'TeeClub',
      'content-language': 'en-CA',
      'distribution': 'global',
      'rating': 'general',
      'revisit-after': '3 days', // More frequent for city pages
      
      // Schema.org structured data for city/collection page
      'script:ld+json': JSON.stringify({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": `${cityName} Golf Courses`,
        "description": description,
        "url": canonicalUrl,
        "mainEntity": {
          "@type": "ItemList",
          "name": `Golf Courses in ${cityName}`,
          "description": `Find and book tee times at golf courses in ${cityName}`,
          "numberOfItems": courses.length,
          "itemListElement": courses.map((course, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "url": `${siteUrl}/course/${course.slug}`,
            "name": course.name,
            "image": course.image
          }))
        },
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": siteUrl
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "Cities",
              "item": `${siteUrl}/cities`
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": cityName,
              "item": canonicalUrl
            }
          ]
        },
        "about": {
          "@type": "Place",
          "name": cityName,
          "description": `Golf courses and tee time search in ${cityName}`,
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": "49.2827", // Default - should be updated with actual coordinates
            "longitude": "-123.1207"
          }
        },
        "provider": {
          "@type": "Organization",
          "name": "TeeClub",
          "url": siteUrl,
          "logo": `${siteUrl}/logo.png`
        }
      }),

      // Local business collection schema
      'script:ld+json:business-collection': JSON.stringify({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "@id": canonicalUrl,
        "name": `${cityName} Golf Course Directory - TeeClub`,
        "description": description,
        "image": primaryImage,
        "url": canonicalUrl,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": cityName,
          "addressRegion": "Canada",
          "addressCountry": "Canada"
        },
        "areaServed": {
          "@type": "City",
          "name": cityName
        },
        "hasMap": canonicalUrl + "#map",
        "makesOffer": courses.map(course => ({
          "@type": "Offer",
          "description": `Find tee times at ${course.name}`,
          "url": `${siteUrl}/course/${course.slug}`,
          "priceCurrency": "CAD",
          "availability": "https://schema.org/InStock",
          "validFrom": new Date().toISOString(),
          "category": "Golf Course Search"
        }))
      }),

      // FAQ structured data (if FAQs exist)
      ...(faqs && faqs.length > 0 ? {
        'script:ld+json:faq': JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqs.map((faq) => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.answer
            }
          }))
        })
      } : {}),

      // Hreflang for international SEO
      'link:hreflang:en-ca': canonicalUrl,
      'link:hreflang:en': canonicalUrl,
      'link:hreflang:x-default': canonicalUrl,

      // Mobile optimization
      'format-detection': 'telephone=no',
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      'apple-mobile-web-app-title': `${cityName} Golf - TeeClub`,

      // Performance and caching hints
      'dns-prefetch': 'https://fonts.googleapis.com',
      'preconnect': 'https://fonts.gstatic.com',
      
      // Social media optimization
      'fb:app_id': process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
      'article:author': 'TeeClub',
      'article:publisher': 'TeeClub',
    },

    // Icons and manifest
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
    
    manifest: '/manifest.json',

    // Viewport for mobile optimization
    viewport: {
      width: 'device-width',
      initialScale: 1,
      maximumScale: 5,
      userScalable: true,
    },

    // Additional app-specific metadata
    appleWebApp: {
      capable: true,
      title: `${cityName} Golf - TeeClub`,
      statusBarStyle: 'default',
    },

    // Category for app stores
    category: 'Golf Course Search',
  };
}

import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.SITE_URL || 'https://teeclub.golf'
  
  // Static routes
  const staticRoutes = [
    '',
    '/cities',
    '/vancouver',
    '/burnaby', 
    '/surrey',
    '/richmond',
    '/about',
    '/contact',
    '/search',
    '/terms',
    '/privacy'
  ]

  return staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : route.startsWith('/vancouver') || route.startsWith('/burnaby') || route.startsWith('/surrey') || route.startsWith('/richmond') ? 0.9 : 0.7,
  }))
}
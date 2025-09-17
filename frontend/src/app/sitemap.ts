import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.SITE_URL || 'https://teeclub.golf'
  
  // Static routes
  const staticRoutes = [
    '',
    '/auth/callback',
    '/cities',
    '/vancouver',
    '/burnaby', 
    '/surrey',
    '/richmond',
    '/auth/sign-up',
    '/share-plan',
    '/auth/request-invite',
    '/auth/login',
    '/tee-time-watchlist/create',
    '/unsubscribe',
    '/tee-time-watchlist',
    '/about',
    '/auth/sign-up-success',
    '/contact',
    '/search',
    '/terms',
    '/privacy',
    '/auth/finish-invite',
    '/auth/set-password',
    '/auth/update-password',
    '/auth/forgot-password',
  ]

  return staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : route.startsWith('/vancouver') || route.startsWith('/burnaby') || route.startsWith('/surrey') || route.startsWith('/richmond') ? 0.9 : 0.7,
  }))
}
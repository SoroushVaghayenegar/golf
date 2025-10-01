import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

async function getAllCitiesSlugs(): Promise<string[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('cities')
      .select('slug')

    if (!data || error) {
      console.error('Error fetching cities:', error)
      return []
    }

    return data.map(city => city.slug).filter(slug => slug)
  } catch (error) {
    console.error('Unexpected error fetching cities:', error)
    return []
  }
}

async function getAllCoursesSlugs(): Promise<string[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('courses')
      .select('slug')

    if (!data || error) {
      console.error('Error fetching courses:', error)
      return []
    }

    return data.map(course => course.slug).filter(slug => slug)
  } catch (error) {
    console.error('Unexpected error fetching courses:', error)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.SITE_URL || 'https://teeclub.golf'
  
  // Fetch cities and courses from database
  const [citySlugs, courseSlugs] = await Promise.all([
    getAllCitiesSlugs(),
    getAllCoursesSlugs()
  ])

  // Static routes
  const staticRoutes = [
    '',
    '/about',
    '/contact',
    '/search',
    '/terms',
    '/privacy'
  ]

  // City routes
  const cityRoutes = citySlugs.map(slug => `/city/${slug}`)
  
  // Course routes
  const courseRoutes = courseSlugs.map(slug => `/course/${slug}`)

  // Combine all routes
  const allRoutes = [...staticRoutes, ...cityRoutes, ...courseRoutes]

  return allRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1.0
  }))
}
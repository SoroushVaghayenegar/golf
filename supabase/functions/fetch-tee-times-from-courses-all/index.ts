// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "@supabase/supabase-js"
import { Course } from "./Course.ts"
import { fetchCourseTeeTimes } from "./utils.ts"

Deno.serve(async (req) => {
  // Start timer
  const startTime = performance.now()
    
  // Create Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Fetch courses from the database with city name
  const { data: coursesData, error } = await supabase
    .from('courses')
    .select(`
      *,
      cities!inner(name)
    `)
    .eq('external_api', 'CPS')

  if (error) {
    throw new Error(`Error fetching courses: ${error.message}`)
  }

  // Convert to Course objects
  const courses = coursesData.map(courseData => Course.fromObject(courseData))

  // Get current date in Vancouver timezone 
  const getVancouverDate = () => {
    const vancouverTime = new Date(new Date().toLocaleString('en', {timeZone: 'America/Vancouver'}).split(",")[0])
    return vancouverTime
  }

  const startDate = getVancouverDate()
  
  // Process all courses and dates in parallel
  const promises = courses.flatMap(course => {
    return Array.from({ length: course.booking_visibility_days + 1 }, (_, i) => {
      const searchDate = new Date(startDate)
      searchDate.setDate(searchDate.getDate() + i)
      return fetchCourseTeeTimes(course, searchDate)
    })
  })

  // Wait for all promises to complete
  await Promise.all(promises)

  // End timer and calculate execution time
  const endTime = performance.now()
  const executionTime = endTime - startTime

  return new Response(
    JSON.stringify({
      success: true,
      executionTime: executionTime,
    }),
    { headers: { "Content-Type": "application/json" } },
  )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/fetch-tee-times-from-courses-all' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

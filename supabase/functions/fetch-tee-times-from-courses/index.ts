// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "@supabase/supabase-js"
import { Course } from "./Course.ts"
import { timeStringToMinutes } from "./utils.ts"

Deno.serve(async (req) => {
  try {
    // Start timer
    const startTime = performance.now()
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const fetchEndpoint = "https://pwgthtueicuiaimfaggt.supabase.co/functions/v1/fetch-tee-times-from-course"

    // Fetch courses from the database with city name
    const { data: coursesData, error } = await supabase
      .from('courses')
      .select(`
        *,
        cities!inner(name)
      `)

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

    const getVancouverTime24HourFormat = () => {
      const vancouverTime = new Date(new Date().toLocaleString('en', {timeZone: 'America/Vancouver'}))

      const hours = vancouverTime.getHours().toString().padStart(2, '0');
      const minutes = vancouverTime.getMinutes().toString().padStart(2, '0');

      return `${hours}:${minutes}`
    }

    const startDate = getVancouverDate()
    
    let invokeCounter = 0
    // Process all courses and dates in parallel without waiting for responses
    for (const course of courses) {
      for (let i = 0; i <= course.booking_visibility_days; i++) {
        if (i === course.booking_visibility_days && course.booking_visibility_start_time) {
          const bookingVisibilityStartTime = timeStringToMinutes(course.booking_visibility_start_time)
          const currentTime = timeStringToMinutes(getVancouverTime24HourFormat())
          if (currentTime < bookingVisibilityStartTime) {
            continue
          }
        }
        const searchDate = new Date(startDate)
        searchDate.setDate(searchDate.getDate() + i)

        // Fire off the request without awaiting - don't wait for response
        fetch(fetchEndpoint, {
          method: 'POST',
          body: JSON.stringify({ course, searchDate }),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          },
        })
        invokeCounter++
      }
    }

    // End timer and calculate execution time
    const endTime = performance.now()
    const executionTime = (endTime - startTime) / 1000
    
    return new Response(
      JSON.stringify({
        executionTime: `${executionTime.toFixed(2)}ms`,
        invokeCounter: invokeCounter,
        result: "success"
      }),
      { headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" } 
      },
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/fetch-tee-times-from-courses' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

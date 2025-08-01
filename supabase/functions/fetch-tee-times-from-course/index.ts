// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "@supabase/supabase-js"
import { Course } from "./Course.ts"
import { fetchCourseTeeTimes } from "./utils.ts"
import * as Sentry from 'https://deno.land/x/sentry/index.mjs'

Sentry.init({
  // https://docs.sentry.io/product/sentry-basics/concepts/dsn-explainer/#where-to-find-your-dsn
  dsn: "https://1dc02eb43236272edaca0faba6c990c6@o4509770601332736.ingest.us.sentry.io/4509770808819712",

  defaultIntegrations: false,
  // Performance Monitoring
  tracesSampleRate: 1.0,
  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
})

// Set region and execution_id as custom tags
Sentry.setTag('region', Deno.env.get('SB_REGION'))
Sentry.setTag('execution_id', Deno.env.get('SB_EXECUTION_ID'))

Deno.serve(async (req) => {
  try {
    const startTime = performance.now()
    // Parse the request body
    const { course, searchDate } = await req.json()
    
    // Validate required parameters
    if (!course) {
      return new Response(
        JSON.stringify({ error: "Course is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }
    
    if (!searchDate) {
      return new Response(
        JSON.stringify({ error: "Search date is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }
    
    // Convert course to Course instance
    const courseInstance = Course.fromObject(course)
    
    // Convert searchDate string to Date object
    const searchDateObj = new Date(searchDate)
    
    // Validate date
    if (isNaN(searchDateObj.getTime())) {
      return new Response(
        JSON.stringify({ error: "Invalid search date format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Fetch tee times
    const result = await fetchCourseTeeTimes(courseInstance, searchDateObj)
    
    // Prepare upsert data
    const upsertData = {
      course_id: result.courseId,
      date: result.date,
      tee_times_data: result.teeTimes,
      tee_times_count: result.teeTimes.length,
      updated_at: new Date().toISOString()
    }
    
    // Upsert to database
    const { error: upsertError } = await supabase
      .from('tee_times')
      .upsert(upsertData, { onConflict: ['course_id', 'date'] })
    
    if (upsertError) {
      console.error('Error upserting tee_times:', upsertError.message)
      throw new Error(`Upsert failed: ${upsertError.message}`)
    }
    
    const endTime = performance.now()
    const executionTime = (endTime - startTime) / 1000
    console.info(`Execution time: ${executionTime.toFixed(2)}s`)

    return new Response(
      JSON.stringify({
        ...result,
        message: "Tee times fetched and saved successfully"
      }),
      { headers: { "Content-Type": "application/json" } }
    )
    
  } catch (error) {
    console.error("Error processing request:", error)
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/fetch-tee-times-from-course' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

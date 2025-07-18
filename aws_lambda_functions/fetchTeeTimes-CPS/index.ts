import { Course } from "./Course"
import { createClient } from "@supabase/supabase-js"

export const handler = async (event: any) => {
  // Start timer
  const startTime = performance.now()
    
  // Create Supabase client
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const fetchEndpoint = "https://pwgthtueicuiaimfaggt.supabase.co/functions/v1/fetch-tee-times-from-course"

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
  
  let invokeCounter = 0
  // Process all courses and dates in parallel without waiting for responses
  for (const course of courses) {
    for (let i = 0; i <= course.booking_visibility_days; i++) {
      const searchDate = new Date(startDate)
      searchDate.setDate(searchDate.getDate() + i)

      // Fire off the request without awaiting - don't wait for response
      fetch(fetchEndpoint, {
        method: 'POST',
        body: JSON.stringify({ course, searchDate }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
      })
      invokeCounter++
    }
  }

  // End timer and calculate execution time
  const endTime = performance.now()
  const executionTime = endTime - startTime

  console.log(`Execution time: ${executionTime.toFixed(2)}s`)
  console.log(`Total invocations sent: ${invokeCounter}`)
  };
  
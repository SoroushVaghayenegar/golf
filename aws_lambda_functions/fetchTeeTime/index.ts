import { Course } from "./Course"
import { fetchCourseTeeTimes } from "./utils"
import { createClient } from "@supabase/supabase-js"

export const handler = async (event: any) => {
  // Get course and date from event
  const courseObj = JSON.parse(event.body).course
  const searchDateString = JSON.parse(event.body).searchDate

  if (!courseObj || !searchDateString) {
    throw new Error("Course and date are required")
  }

  // Convert searchDate string to Date object
  const searchDate = new Date(searchDateString)

  // Start timer
  const startTime = performance.now()
    
  // Create Supabase client
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Convert to Course objects
  const course = Course.fromObject(courseObj)

  
  const result = await fetchCourseTeeTimes(course, searchDate)

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
    .upsert(upsertData, { onConflict: 'course_id,date' })
  
  if (upsertError) {
    console.error('Error upserting tee_times:', upsertError.message)
    throw new Error(`Upsert failed: ${upsertError.message}`)
  }

  // End timer and calculate execution time
  const endTime = performance.now()
  const executionTime = (endTime - startTime) / 1000

  console.log(`Success - Execution time: ${executionTime.toFixed(2)}s`)
};
  
import { Course } from "./Course"
import { fetchCourseTeeTimes, batchUpsertTeeTimes } from "./utils"
import { createClient } from "@supabase/supabase-js"

export const handler = async (event: any) => {
  // Start timer
  const startTime = performance.now()
    
  // Create Supabase client
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Fetch courses from the database with city name
  const { data: coursesData, error } = await supabase
  .from('courses')
  .select(`
    *,
    cities!inner(name)
  `)
  .eq('external_api', 'CHRONO_LIGHTSPEED')

  if (error) {
  throw new Error(`Error fetching courses: ${error.message}`)
  }

  // Convert to Course objects
  const courses = coursesData.map(courseData => Course.fromObject(courseData))
  console.log(`Fetched ${courses.length} courses`)

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
  
  console.log(`Fetching tee times for ${promises.length} dates`)

  // Add progress tracking with zero performance impact
  let completed = 0
  const total = promises.length
  const trackedPromises = promises.map((promise, index) => 
    promise.then(result => {
      console.log(`Progress: ${++completed}/${total} (${Math.round((completed/total)*100)}%)`)
      return result
    })
  )

  const results = await Promise.all(trackedPromises)
  const teeTimes = results.flat()

  // Batch upsert all results to database
  console.log(`Saving ${results.length} course/date combinations to database`)
  const upsertResult = await batchUpsertTeeTimes(supabase, results)
  
  // Check if there were any errors during batch upsert
  const hasErrors = upsertResult.errors.length > 0
  if (hasErrors) {
    console.error(`Batch upsert completed with ${upsertResult.errors.length} batch errors`)
    upsertResult.errors.forEach(error => {
      console.error(`Batch ${error.batch}: ${error.error}`)
    })
  }

  // End timer and calculate execution time
  const endTime = performance.now()
  const executionTime = (endTime - startTime) / 1000

  // Log final summary
  console.log(`=== EXECUTION SUMMARY ===`)
  console.log(`Execution time: ${executionTime.toFixed(2)}s`)
  console.log(`Total courses processed: ${courses.length}`)
  console.log(`Total course/date combinations: ${results.length}`)
  console.log(`Total tee times found: ${teeTimes.length}`)
  console.log(`Database batches processed: ${upsertResult.totalBatches}`)
  console.log(`Database errors: ${upsertResult.errors.length}`)
  console.log(`Status: ${hasErrors ? 'COMPLETED WITH ERRORS' : 'SUCCESS'}`)
  console.log(`========================`)

  const response = {
    statusCode: hasErrors ? 500 : 200,
    body: JSON.stringify({
      success: !hasErrors,
      message: hasErrors 
        ? `Completed with ${upsertResult.errors.length} batch errors`
        : "Success"
    }),
  };
  return response;
  };
  
import { Course } from "./Course"
import { fetchCourseTeeTimes, batchUpsertTeeTimes, timeStringToMinutes } from "./utils"
import { createClient } from "@supabase/supabase-js"
import ProgressBar from "progress"

export const handler = async () => {
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
      .eq('external_api', 'CPS')

      if (error) {
        throw new Error(`Error fetching courses: ${error.message}`)
      }

      // Convert to Course objects
      const courses = coursesData.map(courseData => Course.fromObject(courseData))
      console.log(`Fetched ${courses.length} courses`)

      // Get current date in Vancouver timezone 
      const getDate = (timezone: string) => {
        const date = new Date(new Date().toLocaleString('en', {timeZone: timezone}).split(",")[0])
        return date
      }

      const get24HourFormat = (timezone: string) => {
        const time = new Date(new Date().toLocaleString('en', {timeZone: timezone}))

        const hours = time.getHours().toString().padStart(2, '0');
        const minutes = time.getMinutes().toString().padStart(2, '0');

        return `${hours}:${minutes}`
      }

      // Build array of course/date combinations to process
      const tasks = courses.flatMap(course => {
        const startDate = getDate(course.timezone)
        return Array.from({ length: course.booking_visibility_days + 1 }, (_, i) => {
          if (i === course.booking_visibility_days && course.booking_visibility_start_time) {
          const bookingVisibilityStartTime = timeStringToMinutes(course.booking_visibility_start_time)
              const currentTime = timeStringToMinutes(get24HourFormat(course.timezone))
              if (currentTime < bookingVisibilityStartTime) {
                // Return null to be filtered out later, instead of invalid structure
                return null
              }
          }
          const searchDate = new Date(startDate)
          searchDate.setDate(searchDate.getDate() + i)
          return { course, searchDate }
        })
      }).filter(task => task !== null)
      
      console.log(`Fetching tee times for ${tasks.length} dates`)

      // Process each date sequentially with progress bar or simple logging
      const results = []
      const isTTY = process.stdout.isTTY
      
      let progressBar: ProgressBar | null = null
      if (isTTY) {
        progressBar = new ProgressBar(
          'Progress [:bar] :percent | :current/:total | ETA: :etas | Rate: :rate/s | :course - :date',
          {
            complete: '█',
            incomplete: '░',
            width: 30,
            total: tasks.length,
          }
        )
      } else {
        console.log('Processing tasks (no TTY detected, using simple logging)...')
      }
      
      for (let i = 0; i < tasks.length; i++) {
        const { course, searchDate } = tasks[i]
        
        const result = await fetchCourseTeeTimes(course, searchDate)
        results.push(result)
        
        if (progressBar) {
          progressBar.tick({
            course: course.name.padEnd(15).substring(0, 15),
            date: searchDate.toISOString().split('T')[0]
          })
        } else {
          // Log progress every 10 tasks or on first/last
          if (i === 0 || i === tasks.length - 1 || (i + 1) % 10 === 0) {
            console.log(`Progress: ${i + 1}/${tasks.length} (${((i + 1) / tasks.length * 100).toFixed(1)}%) - ${course.name} - ${searchDate.toISOString().split('T')[0]}`)
          }
        }
        
        if (i < tasks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
      
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

      // Send health check signal
      await fetch('https://hc-ping.com/f1d5e07a-6beb-41ca-a0ad-0bcc6866a717');

      return response;
};

// Allow direct execution when running the file directly
if (require.main === module) {
  handler().then(result => {
    console.log('Direct execution completed');
    console.log('Result:', JSON.stringify(result, null, 2));
    process.exit(0);
  }).catch(error => {
    console.error('Direct execution failed:', error);
    process.exit(1);
  });
}
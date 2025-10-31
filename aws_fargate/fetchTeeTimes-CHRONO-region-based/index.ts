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

      const regionIds = process.env.REGION_ID!.split(',').map(Number)

      // Fetch courses from the database with city name
      const { data: coursesData, error } = await supabase
      .from('courses')
      .select(`
        *,
        cities!inner(name)
        cities!inner(region_id)
      `)
      .in('cities.region_id', regionIds)
      .eq('external_api', 'CHRONO_LIGHTSPEED')

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

      // Process with concurrency of 2 using a simple worker pool
      // Upsert to DB every UPSERT_BATCH_SIZE tasks to manage memory
      const UPSERT_BATCH_SIZE = 20
      const results = [] as any[]
      const allErrors: Array<{batch: number, error: string}> = []
      const fetchErrors: Array<{course: string, date: string, error: string, statusCode?: number}> = []
      let totalTeeTimes = 0
      let totalUpsertBatches = 0
      let successfulFetches = 0
      let failedFetches = 0
      
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

      let nextIndex = 0
      let completed = 0

      // Helper function to upsert current results and clear memory
      const upsertAndClearResults = async () => {
        if (results.length === 0) return
        
        console.log(`\nUpserting ${results.length} course/date combinations to database...`)
        const upsertResult = await batchUpsertTeeTimes(supabase, results)
        totalUpsertBatches += upsertResult.totalBatches
        
        // Track errors
        if (upsertResult.errors.length > 0) {
          allErrors.push(...upsertResult.errors)
          console.error(`Batch upsert completed with ${upsertResult.errors.length} errors`)
        }
        
        // Count tee times before clearing
        const batchTeeTimes = results.reduce((sum, r) => sum + r.teeTimes.length, 0)
        totalTeeTimes += batchTeeTimes
        
        // Clear results array to free memory
        results.length = 0
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc()
          console.log('Garbage collection triggered')
        }
      }

      const runWorker = async () => {
        while (true) {
          const currentIndex = nextIndex
          if (currentIndex >= tasks.length) return
          nextIndex++

          const { course, searchDate } = tasks[currentIndex] as any
          const dateString = searchDate.toISOString().split('T')[0]
          
          try {
            const result = await fetchCourseTeeTimes(course, searchDate)
            
            // Check if the result contains an error
            if (result.error) {
              fetchErrors.push({
                course: course.name,
                date: dateString,
                error: result.error.message,
                statusCode: result.error.statusCode
              })
              
              failedFetches++
              
              // Only log non-403 errors to console
              if (result.error.statusCode !== 403) {
                console.error(`\n[ERROR] Failed to fetch ${course.name} on ${dateString}: ${result.error.message}`)
              }
            } else {
              // Only save successful results
              results.push(result)
              successfulFetches++
            }
          } catch (error) {
            // Track unexpected errors that weren't caught in fetchCourseTeeTimes
            const errorMessage = error instanceof Error ? error.message : String(error)
            const statusCode = (error as any).statusCode
            
            fetchErrors.push({
              course: course.name,
              date: dateString,
              error: errorMessage,
              statusCode: statusCode
            })
            
            failedFetches++
            
            // Only log non-403 errors to console
            if (statusCode !== 403) {
              console.error(`\n[ERROR] Failed to fetch ${course.name} on ${dateString}: ${errorMessage}`)
            }
          }

          completed++
          if (progressBar) {
            progressBar.tick({
              course: course.name.padEnd(15).substring(0, 15),
              date: dateString
            })
          } else {
            // Log only at 1%, 25%, 50%, 75%, and 100%
            const progress = (completed / tasks.length) * 100
            const thresholds = [1, 25, 50, 75, 100]
            const lastProgress = ((completed - 1) / tasks.length) * 100
            
            // Check if we just crossed a threshold
            const crossedThreshold = thresholds.find(threshold => 
              lastProgress < threshold && progress >= threshold
            )
            
            if (crossedThreshold !== undefined) {
              console.log(`Progress: ${completed}/${tasks.length} (${progress.toFixed(1)}%)`)
            }
          }
          
          // Upsert to DB every UPSERT_BATCH_SIZE tasks to manage memory
          if (results.length >= UPSERT_BATCH_SIZE) {
            await upsertAndClearResults()
          }
        }
      }

      const concurrency = 10
      const workers = Array.from({ length: concurrency }, () => runWorker())
      await Promise.all(workers)
      
      // Upsert any remaining results
      await upsertAndClearResults()

      
      // Check if there were any errors during batch upsert or fetching
      const hasErrors = allErrors.length > 0 || fetchErrors.length > 0

      // End timer and calculate execution time
      const endTime = performance.now()
      const executionTime = (endTime - startTime) / 1000

      // Log final summary
      console.log(`\n=== EXECUTION SUMMARY ===`)
      console.log(`Execution time: ${executionTime.toFixed(2)}s`)
      console.log(`Total courses processed: ${courses.length}`)
      console.log(`Total course/date combinations: ${tasks.length}`)
      console.log(`Successful fetches: ${successfulFetches}`)
      console.log(`Failed fetches: ${failedFetches}`)
      console.log(`Success rate: ${((successfulFetches / tasks.length) * 100).toFixed(1)}%`)
      console.log(`Total tee times found: ${totalTeeTimes}`)
      console.log(`Database batches processed: ${totalUpsertBatches}`)
      console.log(`Database errors: ${allErrors.length}`)
      console.log(`Fetch errors: ${fetchErrors.length}`)
      
      // Log error breakdown by status code
      if (fetchErrors.length > 0) {
        const errorsByStatus = fetchErrors.reduce((acc, err) => {
          const status = err.statusCode || 'unknown'
          acc[status] = (acc[status] || 0) + 1
          return acc
        }, {} as Record<string | number, number>)
        console.log(`Error breakdown by status: ${JSON.stringify(errorsByStatus)}`)
      }
      
      console.log(`Status: ${hasErrors ? 'COMPLETED WITH ERRORS' : 'SUCCESS'}`)
      console.log(`========================`)

      const response = {
        statusCode: hasErrors ? 500 : 200,
        body: JSON.stringify({
          success: !hasErrors,
          message: hasErrors 
            ? `Completed with ${fetchErrors.length} fetch errors and ${allErrors.length} batch errors`
            : "Success",
          stats: {
            totalTasks: tasks.length,
            successfulFetches: successfulFetches,
            failedFetches: failedFetches,
            successRate: `${((successfulFetches / tasks.length) * 100).toFixed(1)}%`,
            totalTeeTimes: totalTeeTimes,
            fetchErrors: fetchErrors.length,
            databaseErrors: allErrors.length
          }
        }),
      };

      if (totalTeeTimes === 0 && successfulFetches === 0) {
        console.error(`No tee times found for any course/date combinations and no successful fetches`)
        throw new Error(`No tee times found for any course/date combinations`)
      }

      // Send health check signal
      await fetch(process.env.CRON_CHECK_URL!);

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
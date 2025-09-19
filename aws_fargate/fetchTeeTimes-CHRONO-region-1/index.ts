import { Course } from "./Course"
import { fetchCourseTeeTimes, batchUpsertTeeTimes, timeStringToMinutes } from "./utils"
import { createClient } from "@supabase/supabase-js"
import * as Sentry from "@sentry/node"
import puppeteer from 'puppeteer';


Sentry.init({
  dsn: "https://baa965932d0a9dbd6f12c98dd937d526@o4509770601332736.ingest.us.sentry.io/4509778658000896",

  // Send structured logs to Sentry
  enableLogs: true,

  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,

  tracesSampleRate: 1.0,
});

export const handler = async () => {
  // Start timer
  const startTime = performance.now()

      // Create Supabase client
      const supabaseUrl = process.env.SUPABASE_URL!
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // Create browser and page once
      const browser = await puppeteer.launch({
        args: [
          '--disable-blink-features=AutomationControlled',
          '--hide-scrollbars',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-webgl',
          '--disable-gpu-compositing',
          '--disable-gpu-sandbox',
        ],
        defaultViewport: null,
        headless: true,
      });

      console.log(`Browser launched in ${performance.now() - startTime}ms`)

      const page = await browser.newPage();

      // Set realistic browser headers
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15');
      
      await page.setRequestInterception(true);

      page.on('request', (req) => {
        const resourceType = req.resourceType();
        const blocked = ['image', 'media', 'font', 'stylesheet', 'other'];

        if (blocked.includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });

      await page.goto('https://www.chronogolf.ca', {
        waitUntil: 'domcontentloaded',
      });

      console.log(`Chrono page loaded in ${performance.now() - startTime}ms`)

      // Fetch courses from the database with city name
      const { data: coursesData, error } = await supabase
      .from('courses')
      .select(`
        *,
        cities!inner(name, region_id)
      `)
      .eq('external_api', 'CHRONO_LIGHTSPEED')
      .eq('cities.region_id', 1)
      

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

      // Process all courses and dates in parallel
      const promises = courses.flatMap(course => {
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
          return fetchCourseTeeTimes(page, course, searchDate)
        })
      }).filter(promise => promise !== null)
      
      console.log(`Fetching tee times for ${promises.length} dates`)

      // Add progress tracking with zero performance impact
      let completed = 0
      const total = promises.length
      const trackedPromises = promises.map((promise, index) => 
        promise.then(result => {
          // console.log(`Progress: ${++completed}/${total} (${Math.round((completed/total)*100)}%)`)
          return result
        })
      )

      const results = await Promise.all(trackedPromises)
      const teeTimes = results.flat()

      await page.close();
      await browser.close();


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
      await fetch('https://hc-ping.com/fa811e40-7fab-434b-96aa-9c18bc2f8a3f');

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
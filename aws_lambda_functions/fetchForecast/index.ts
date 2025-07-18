import { City } from "./City"
import { fetchForecast, batchUpsertForecasts } from "./utils"
import { createClient } from "@supabase/supabase-js"

export const handler = async (event: any) => {
  // Start timer
  const startTime = performance.now()
    
  // Create Supabase client
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Fetch cities from the database
  const { data: citiesData, error } = await supabase
  .from('cities')
  .select(`*`)

  if (error) {
  throw new Error(`Error fetching cities: ${error.message}`)
  }

  // Convert to Course objects
  const cities = citiesData.map(cityData => City.fromObject(cityData))
  console.log(`Fetched ${cities.length} cities`)

  // Get current date in Vancouver timezone 
  const getVancouverDate = () => {
    const vancouverTime = new Date(new Date().toLocaleString('en', {timeZone: 'America/Vancouver'}).split(",")[0])
    return vancouverTime
  }

  const startDate = getVancouverDate()


  // Process all courses and dates in parallel
  const promises = cities.flatMap(city => {
    return fetchForecast(city, startDate)
  })
  
  console.log(`Fetching forecasts for ${promises.length} cities`)

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
  const forecasts = results.flat()

  // Batch upsert all results to database
  console.log(`Saving ${results.length} forecasts to database`)
  const upsertResult = await batchUpsertForecasts(supabase, forecasts)
  
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
  console.log(`Total cities processed: ${cities.length}`) 
  console.log(`Total forecasts found: ${forecasts.length}`)
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
  
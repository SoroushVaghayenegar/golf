import { Course } from "./Course";
import { TeeTime } from "./TeeTime";
import * as Sentry from "@sentry/node";


const CHRONO_LIGHTSPEED = "CHRONO_LIGHTSPEED"

export async function fetchCourseTeeTimes(page: any, course: Course, searchDate: Date): Promise<{courseId: number, date: string, teeTimes: TeeTime[]}> {
    if (course.external_api !== CHRONO_LIGHTSPEED) {
      throw new Error(`Unsupported external API: ${course.external_api}`)
    }
        
    // For CHRONO/LIGHTSPEED, fetch tee times for each course_holes value
    const courseHolesArray = course.external_api_attributes.course_holes;
    const clubId = course.external_api_attributes.club_id;
    const courseId = course.external_api_attributes.course_id;
    const affiliationTypeId = course.external_api_attributes.affiliation_type_id;
    const clubLinkName = course.external_api_attributes.club_link_name;

    // Parallelize fetching for each course holes value
    const teeTimesPromises = courseHolesArray.map(holes => 
        fetchTeeTimesFromChronoLightspeed(
            page,
            course.id,
            course.name,
            clubId,
            courseId,
            affiliationTypeId,
            holes,
            searchDate,
            clubLinkName
        )
    );
    
    const teeTimesResults = await Promise.all(teeTimesPromises);
    const allTeeTimes = teeTimesResults.flat();
    
    return {
        courseId: course.id,
        date: searchDate.toISOString().split('T')[0],
        teeTimes: allTeeTimes
    }
}


export async function fetchTeeTimesFromChronoLightspeed(page: any, dbCourseId: number, courseName: string, club_id: number, course_id: number, affiliation_type_id: number, course_holes: number, searchDate: Date, clubLinkName: string): Promise<TeeTime[]> {
   // format to '%Y-%m-%d'
   const dateString = searchDate.toISOString().split('T')[0]
   const baseUrl = `https://www.chronogolf.ca/marketplace/clubs/${club_id}/teetimes?date=${dateString}&course_id=${course_id}&nb_holes=${course_holes}`
    
   const teeTimesMap: Map<string, Map<string, any>> = new Map();

   // Parallelize fetching for different player counts
   const playerCounts = [4, 3, 2, 1];
   const fetchPromises = playerCounts.map(async (players) => {
       let fullUrl = baseUrl;
       for (let i: number = 0; i < players; i++) {
           fullUrl += `&affiliation_type_ids%5B%5D=${affiliation_type_id}`;
       }
       
      try {
           const response = await fetchWithRetry(page, courseName, club_id, fullUrl, {}, 5, 5000, 1000);
           // Extract the data from the response
           const teeTimes = response.data;
           return { players, teeTimes };
       } catch (error) {
           console.error(error);
           return { players, teeTimes: [] };
       }
       
       // This should never be reached, but TypeScript needs it
       return { players, teeTimes: [] };
   });

   const results = await Promise.all(fetchPromises);
   
   // Process all results
   for (const { teeTimes } of results) {
       for (const teeTime of teeTimes as any[]) {
           if (teeTime["out_of_capacity"] == true || teeTime["restrictions"].length > 0) {
               continue;
           }
           const startTime = teeTime["start_time"];
           if (!teeTimesMap.has(startTime)) {
               teeTimesMap.set(startTime, teeTime);
           }
       }
   }
   
   const teeTimes: TeeTime[] = []
   for (const teeTime of teeTimesMap.values()) {
    const startDateTime = teeTime["date"] + "T" + teeTime["start_time"]
    const playersAvailable = teeTime["green_fees"].length
    const price = teeTime["green_fees"][0]["green_fee"]
    const bookingLink = getChronoLightspeedBookingLink(clubLinkName, course_id, course_holes, searchDate, affiliation_type_id, playersAvailable, teeTime["id"])
    const teeTimeId = dbCourseId + teeTime["date"].replaceAll('-', '') + teeTime["start_time"].replaceAll(':', '')
    teeTimes.push(new TeeTime(startDateTime, playersAvailable, course_holes, price, bookingLink, teeTimeId))
   }
   return teeTimes
}

function getChronoLightspeedBookingLink(
    clubLinkName: string, 
    courseId: number, 
    nbHoles: number, 
    date: Date, 
    affiliationTypeId: number, 
    numberOfPlayers: number, 
    teetimeId: number
): string {
    const dateStr = date.toISOString().split('T')[0];
    const affiliationTypeIds = Array(numberOfPlayers).fill(affiliationTypeId).join(',');
    return `https://www.chronogolf.ca/club/${clubLinkName}/booking/?source=club&medium=widget#/teetime/review?course_id=${courseId}&nb_holes=${nbHoles}&date=${dateStr}&affiliation_type_ids=${affiliationTypeIds}&teetime_id=${teetimeId}&is_deal=false&new_user=false`;
}

async function fetchWithRetry(page: any, courseName: string, clubId: number, url: string, headers: Record<string, string>, maxRetries: number = 5, maxDelay: number = 19000, minDelay: number = 2000): Promise<any> {
  // Add to headers to pretend this is from a safari browser
  headers["User-Agent"] = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15";
  headers["Accept"] = "application/json";
  headers["Accept-Language"] = "en-CA,en-US;q=0.9,en;q=0.8";
  headers["Accept-Encoding"] = "gzip, deflate, br";
  headers["Connection"] = "keep-alive";
  headers["Sec-Fetch-Dest"] = "empty";
  headers["Sec-Fetch-Mode"] = "cors";
  headers["Referer"] = `https://www.chronogolf.com/en/club/${clubId}/widget?medium=widget&source=club`;
  
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // console.log(`Attempt ${attempt} for ${courseName}: ${url}`);
      
      const data = await page.evaluate(async (url, headers) => {
        try {
          const response = await fetch(url, { 
            headers: headers,
            credentials: 'include'  // Include cookies
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          return await response.json();
        } catch (error) {
          throw new Error(`Fetch failed: ${error.message}`);
        }
      }, url, headers);

      return { data };
    } catch (error: any) {
      lastError = error;
      // console.error(`Attempt ${attempt} failed for ${courseName}:`, error.message);
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate delay between retries
      const delay = Math.min(
        minDelay * Math.pow(2, attempt - 1) + Math.random() * 1000,
        maxDelay
      );
      
      // console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  Sentry.captureException(lastError);
  throw new Error(`Failed to fetch after ${maxRetries} attempts for ${courseName}. Last error: ${lastError?.message}`);
}

/**
 * Batch upsert tee times data to Supabase with conflict resolution
 * @param supabase - Supabase client instance
 * @param results - Array of results from fetchCourseTeeTimes
 * @param batchSize - Number of records to process in each batch (default: 100)
 * @returns Promise with summary of the operation
 */
export async function batchUpsertTeeTimes(
  supabase: any,
  results: Array<{courseId: number, date: string, teeTimes: TeeTime[]}>,
  batchSize: number = 100
): Promise<{
  totalProcessed: number,
  totalBatches: number,
  errors: Array<{batch: number, error: string}>
}> {
  // Transform results into upsert format
  const upsertData = results.map(result => ({
    course_id: result.courseId,
    date: result.date,
    tee_times_data: result.teeTimes,
    tee_times_count: result.teeTimes.length,
    updated_at: new Date().toISOString()
  }))

  const totalRecords = upsertData.length
  const totalBatches = Math.ceil(totalRecords / batchSize)
  const errors: Array<{batch: number, error: string}> = []
  
  console.log(`Starting batch upsert: ${totalRecords} records in ${totalBatches} batches of ${batchSize}`)

  // Process in batches
  for (let i = 0; i < totalBatches; i++) {
    const startIndex = i * batchSize
    const endIndex = Math.min(startIndex + batchSize, totalRecords)
    const batch = upsertData.slice(startIndex, endIndex)
    
    try {
      console.log(`Processing batch ${i + 1}/${totalBatches} (${batch.length} records)`)
      
      const { error: upsertError } = await supabase
        .from('tee_times')
        .upsert(batch, { 
          onConflict: ['course_id', 'date'],
          ignoreDuplicates: false // This ensures updates happen on conflict
        })

      if (upsertError) {
        const errorMsg = `Batch ${i + 1} failed: ${upsertError.message}`
        console.error(errorMsg)
        errors.push({ batch: i + 1, error: upsertError.message })
      } else {
        console.log(`Batch ${i + 1}/${totalBatches} completed successfully`)
      }
    } catch (error) {
      const errorMsg = `Batch ${i + 1} failed with exception: ${error instanceof Error ? error.message : String(error)}`
      console.error(errorMsg)
      errors.push({ batch: i + 1, error: errorMsg })
    }
  }

  const result = {
    totalProcessed: totalRecords,
    totalBatches: totalBatches,
    errors: errors
  }

  console.log(`Batch upsert completed: ${totalRecords} records processed, ${errors.length} batches with errors`)
  
  return result
}

export function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}
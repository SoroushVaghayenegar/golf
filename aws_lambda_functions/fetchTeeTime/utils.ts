import { Course } from "./Course";
import { TeeTime } from "./TeeTime";
import { HttpsProxyAgent } from 'https-proxy-agent';

const CPS = "CPS"
const CHRONO_LIGHTSPEED = "CHRONO_LIGHTSPEED"

export async function fetchCourseTeeTimes(course: Course, searchDate: Date): Promise<{courseId: number, date: string, teeTimes: TeeTime[]}> {
    if (course.external_api === CPS) {
        const subdomain = course.external_api_attributes.subdomain
        const params = course.external_api_attributes.params
        const headers = course.external_api_attributes.headers
        return {
            courseId: course.id,
            date: searchDate.toISOString().split('T')[0],
            teeTimes: await fetchTeeTimesFromCPS(course.name,subdomain, params, headers, searchDate)
        }
    } else if (course.external_api === CHRONO_LIGHTSPEED) {
        
        // For CHRONO/LIGHTSPEED, fetch tee times for each course_holes value
        const courseHolesArray = course.external_api_attributes.course_holes;
        const clubId = course.external_api_attributes.club_id;
        const courseId = course.external_api_attributes.course_id;
        const affiliationTypeId = course.external_api_attributes.affiliation_type_id;
        const clubLinkName = course.external_api_attributes.club_link_name;

        // Parallelize fetching for each course holes value
        const teeTimesPromises = courseHolesArray.map(holes => 
            fetchTeeTimesFromChronoLightspeed(
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
    } else{
        throw new Error(`Unsupported external API: ${course.external_api}`)
    }
}

export async function fetchTeeTimesFromCPS(
  courseName: string,
  subdomain: string,
  params: Record<string, any>,
  headers: Record<string, string>,
  searchDate: Date
): Promise<TeeTime[]> {
  // Add the encoded date to params
  const requestParams = {
    ...params,
    searchDate: searchDate.toDateString()
  };
  
  // Build the URL with query parameters
  const url = new URL(`https://${subdomain}.cps.golf/onlineres/onlineapi/api/v1/onlinereservation/TeeTimes`);
  
  // Add params to URL
  Object.entries(requestParams).forEach(([key, value]) => {
    url.searchParams.append(key, value.toString());
  });
  
  try {
    const response = await fetchWithRetry(courseName, url.toString(), headers, 6, 15000, 1000);
    const teeTimesList = await response.json();
    
    // If the response is an object with messageKey "NO_TEETIMES", return an empty array
    if (
      typeof teeTimesList === "object" &&
      !Array.isArray(teeTimesList) &&
      teeTimesList !== null &&
      (teeTimesList as any)["messageKey"] === "NO_TEETIMES"
    ) {
      return [];
    }

    const teeTimes: TeeTime[] = [];

    for (const teeTimeObject of teeTimesList as any[]) {
      
      // turn time from "%Y-%m-%dT%H:%M:%S"
      const startDateTime = new Date(teeTimeObject["startTime"]);
      const playersAvailable = teeTimeObject["availableParticipantNo"].length;
      const holes = teeTimeObject["holes"];
      const price = teeTimeObject["shItemPrices"][0]["price"];
      const booking_link = `https://${subdomain}.cps.golf`
      teeTimes.push(new TeeTime(startDateTime, playersAvailable, holes, price, booking_link));
    }
    return teeTimes;
  } catch (error) {
    console.error(error);
    console.error(`[${courseName}] Failed to fetch tee times from CPS after retries`);
    return [];
  }
}


export async function fetchTeeTimesFromChronoLightspeed(courseName: string, club_id: number, course_id: number, affiliation_type_id: number, course_holes: number, searchDate: Date, clubLinkName: string): Promise<TeeTime[]> {
   // format to '%Y-%m-%d'
   const dateString = searchDate.toISOString().split('T')[0]
   const baseUrl = `https://www.chronogolf.com/marketplace/clubs/${club_id}/teetimes?date=${dateString}&course_id=${course_id}&nb_holes=${course_holes}`
    
   const teeTimesMap: Map<string, Map<string, any>> = new Map();

   // Parallelize fetching for different player counts
   const playerCounts = [4, 3, 2, 1];
   const fetchPromises = playerCounts.map(async (players) => {
       let fullUrl = baseUrl;
       for (let i: number = 0; i < players; i++) {
           fullUrl += `&affiliation_type_ids%5B%5D=${affiliation_type_id}`;
       }
       
       try {
           const response = await fetchWithRetry(courseName, fullUrl, {}, 5, 6000, 1000);
           const teeTimes = await response.json();
           return { players, teeTimes };
       } catch (error) {
           console.error(`Failed to fetch tee times from Lightspeed for ${players} players after retries`);
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
    const startDateTime = new Date(teeTime["date"] + "T" + teeTime["start_time"])
    const playersAvailable = teeTime["green_fees"].length
    const price = teeTime["green_fees"][0]["green_fee"]
    const bookingLink = getChronoLightspeedBookingLink(clubLinkName, course_id, course_holes, searchDate, affiliation_type_id, playersAvailable, teeTime["id"])
    teeTimes.push(new TeeTime(startDateTime, playersAvailable, course_holes, price, bookingLink))
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

const PROXIES = [
  "http://user-ttimesgolf_Bw3Ck:T_timesgolf1@dc.oxylabs.io:8001",
  "http://user-ttimesgolf_Bw3Ck:T_timesgolf1@dc.oxylabs.io:8002",
  "http://user-ttimesgolf_Bw3Ck:T_timesgolf1@dc.oxylabs.io:8003",
  "http://user-ttimesgolf_Bw3Ck:T_timesgolf1@dc.oxylabs.io:8004",
  "http://user-ttimesgolf_Bw3Ck:T_timesgolf1@dc.oxylabs.io:8005",
  "http://user-ttimesgolf_Bw3Ck:T_timesgolf1@dc.oxylabs.io:8006",
  "http://user-ttimesgolf_Bw3Ck:T_timesgolf1@dc.oxylabs.io:8007",
  "http://user-ttimesgolf_Bw3Ck:T_timesgolf1@dc.oxylabs.io:8008",
  "http://user-ttimesgolf_Bw3Ck:T_timesgolf1@dc.oxylabs.io:8009",
  "http://user-ttimesgolf_Bw3Ck:T_timesgolf1@dc.oxylabs.io:8010",
  "http://user-ttimesgolf_Bw3Ck:T_timesgolf1@dc.oxylabs.io:8011",
  "http://user-ttimesgolf_Bw3Ck:T_timesgolf1@dc.oxylabs.io:8012",
  "http://user-ttimesgolf_Bw3Ck:T_timesgolf1@dc.oxylabs.io:8013",
  "http://user-ttimesgolf_Bw3Ck:T_timesgolf1@dc.oxylabs.io:8014",
  "http://user-ttimesgolf_Bw3Ck:T_timesgolf1@dc.oxylabs.io:8015",
  "http://user-ttimesgolf_Bw3Ck:T_timesgolf1@dc.oxylabs.io:8016",
  "http://user-ttimesgolf_Bw3Ck:T_timesgolf1@dc.oxylabs.io:8017",
  "http://user-ttimesgolf_Bw3Ck:T_timesgolf1@dc.oxylabs.io:8018",
  "http://user-ttimesgolf_Bw3Ck:T_timesgolf1@dc.oxylabs.io:8019",
  "http://user-ttimesgolf_Bw3Ck:T_timesgolf1@dc.oxylabs.io:8020",
  "http://user-ttimesgolf_rnopU:T_timesgolf1@dc.oxylabs.io:8001",
  "http://user-ttimesgolf_rnopU:T_timesgolf1@dc.oxylabs.io:8002",
  "http://user-ttimesgolf_rnopU:T_timesgolf1@dc.oxylabs.io:8003",
  "http://user-ttimesgolf_rnopU:T_timesgolf1@dc.oxylabs.io:8004",
  "http://user-ttimesgolf_rnopU:T_timesgolf1@dc.oxylabs.io:8005"
]

// Global counter for proxy rotation
let proxyIndex = 0;

function getNextProxy(): string {
    // Atomic-ish increment and return
    const index = proxyIndex++;
    return PROXIES[index % PROXIES.length];
}

async function fetchWithRetry(courseName: string, url: string, headers: Record<string, string>, maxRetries: number = 5, maxDelay: number = 19000, minDelay: number = 2000): Promise<Response> {
  // Add to headers to pretend this is from a safari browser
  // headers["User-Agent"] = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15";
  // headers["Accept"] = "application/json, text/plain, */*";
  // headers["Accept-Language"] = "en-CA,en-US;q=0.9,en;q=0.8";
  // headers["Accept-Encoding"] = "gzip, deflate, br";
  // headers["Connection"] = "keep-alive";
  // headers["Sec-Fetch-Dest"] = "empty";
  // headers["Sec-Fetch-Mode"] = "cors";
  const useProxy = Math.random() < 0.5;
  let proxy = useProxy ? getNextProxy() : null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            let fetchOptions: any = { headers: headers };
            if (proxy !== null) {
                fetchOptions.agent = new HttpsProxyAgent(proxy);
            }
            
            const response = await fetch(url, fetchOptions);
            if (!response.ok) {
                let errorBody = '';
                try {
                    // Try to read the response body for error details
                    errorBody = await response.text();
                    // Limit error body length to avoid huge logs
                    if (errorBody.length > 500) {
                        errorBody = errorBody.substring(0, 500) + '...';
                    }
                } catch (bodyError) {
                    errorBody = 'Unable to read response body';
                }
                
                const errorMessage = `Error fetching ${courseName}: ${response.status} ${response.statusText} ${errorBody ? ` - ${errorBody}` : ''}`;
                
                
                if (attempt === maxRetries) {
                  const proxyStatus = proxy ? "with-proxy" : "without-proxy";
                  console.error(`Error status: ${response.status} [${courseName}] ${proxyStatus}`);
                }
                throw new Error(errorMessage);
            }
            return response;
        } catch (error) {
            if (attempt < maxRetries) {
                const delay = Math.floor(Math.random() * maxDelay) + minDelay; // Random delay between 1000-15000ms
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw new Error(`[${courseName}] Failed to fetch after ${maxRetries} attempts`);
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
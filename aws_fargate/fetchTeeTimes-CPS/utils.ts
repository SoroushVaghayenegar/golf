import { Course } from "./Course";
import { TeeTime } from "./TeeTime";
import * as Sentry from "@sentry/node";

const CPS = "CPS"

export async function fetchCourseTeeTimes(course: Course, searchDate: Date): Promise<{courseId: number, date: string, teeTimes: TeeTime[]}> {
    if (course.external_api === CPS) {
        const subdomain = course.external_api_attributes.subdomain
        const params = course.external_api_attributes.params
        const headers = course.external_api_attributes.headers
        return {
            courseId: course.id,
            date: searchDate.toISOString().split('T')[0],
            teeTimes: await fetchTeeTimesFromCPS(course.id, course.name, subdomain, params, headers, searchDate, course.requires_login)
        }
    } else{
        throw new Error(`Unsupported external API: ${course.external_api}`)
    }
}

export async function fetchTeeTimesFromCPS(
  courseId: number,
  courseName: string,
  subdomain: string,
  params: Record<string, any>,
  headers: Record<string, string>,
  searchDate: Date,
  requiresLogin: boolean
): Promise<TeeTime[]> {
  // Add the encoded date to params
  const requestParams = {
    ...params,
    searchDate: searchDate.toDateString()
  };
  
  if (requiresLogin) {
    const loginParams = {
      grant_type: 'password',
      username: "account@teeclub.golf",
      password: "TeeclubAdmin1!",
      client_id: "js1",
      client_secret: "v4secret"
    }
    const loginUrl = `https://${subdomain}.cps.golf/identityapi/connect/token`
    const loginHeaders = {
      ...headers,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
    const accessToken = await getAccessTokenWithRetry(courseName, loginUrl, loginParams, loginHeaders);
    headers['authorization'] = `Bearer ${accessToken}`;
  }

  // Build the URL with query parameters
  const url = new URL(`https://${subdomain}.cps.golf/onlineres/onlineapi/api/v1/onlinereservation/TeeTimes`);
  
  // Add params to URL
  Object.entries(requestParams).forEach(([key, value]) => {
    url.searchParams.append(key, value.toString());
  });
  
  try {
    const response = await fetchWithRetry(courseName, url.toString(), headers, 5, 10000, 1000);
    const teeTimesList = await response.json();
    
    // If the response is an object with messageKey "NO_TEETIMES", return an empty array
    if (
      typeof teeTimesList === "object" &&
      !Array.isArray(teeTimesList) &&
      teeTimesList !== null &&
      teeTimesList["messageKey"] === "NO_TEETIMES"
    ) {
      return [];
    }

    const teeTimes: TeeTime[] = [];

    for (const teeTimeObject of teeTimesList as any[]) {
      const holesDisplay = teeTimeObject["holesDisplay"].toLowerCase();
      // if there is an "or" in the holesDisplay, then split by or
      const holesArray = holesDisplay.includes("or") ? holesDisplay.split("or").map((s: string) => s.trim()) : [holesDisplay];
      
      for (const holesStr of holesArray) {
        const price = teeTimeObject["shItemPrices"].find((priceObj: any) => priceObj.shItemCode === `GreenFee${holesStr}`)?.currentPrice ||
                      teeTimeObject["shItemPrices"].find((priceObj: any) => priceObj.shItemCode === `Package${holesStr}`)?.currentPrice ||
                      teeTimeObject["shItemPrices"].find((priceObj: any) => priceObj.shItemCode === `GreenFee${holesStr}Online`)?.currentPrice;

        if (!price) {
          Sentry.captureException(new Error(`[${courseName}] No price found for ${holesStr}`));
        }
        
        // Get a range of numbers from "minPlayer" to "maxPlayer"
        const availableParticipants = Array.from({ length: teeTimeObject["maxPlayer"] - teeTimeObject["minPlayer"] + 1 }, (_, i) => teeTimeObject["minPlayer"] + i);
        const startDateTime = new Date(teeTimeObject["startTime"]);
        const playersAvailable = teeTimeObject["availableParticipantNo"].length;
        const holes = parseInt(holesStr);
        const booking_link = `https://${subdomain}.cps.golf`;
        const starting_tee = teeTimeObject["startingTee"];
        const tee_time_id = courseId + startDateTime.toISOString().split('T')[0].replaceAll('-', '') + startDateTime.getHours() + startDateTime.getMinutes() + "-" + holesStr + "-" + starting_tee;
        teeTimes.push(new TeeTime(startDateTime, playersAvailable, availableParticipants, holes, price, booking_link, tee_time_id, starting_tee));
      }
    }
    return teeTimes;
  } catch (error) {
    console.error(error);
    console.error(`[${courseName}] Failed to fetch tee times from CPS after retries`);
    return [];
  }
}

async function getAccessTokenWithRetry(courseName: string, url: string, body: Record<string, string>, headers: Record<string, string>, maxRetries: number = 5, maxDelay: number = 19000, minDelay: number = 2000): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: new URLSearchParams(body).toString()
      })
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to get access token: ${response.status} ${response.statusText} ${errorBody}`);
      }
      const data = await response.json() as any;
      return data.access_token;
    } catch (error) {
      if (attempt < maxRetries) {
        const delay = Math.floor(Math.random() * maxDelay) + minDelay; // Random delay between 1000-15000ms
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      else{
        throw new Error(`[${courseName}] Failed to fetch after ${maxRetries} attempts - ${error}`);
      }
    }
  }
  Sentry.captureException(new Error(`[${courseName}] Failed to get access token after ${maxRetries} attempts`));
  throw new Error(`[${courseName}] Failed to get access token after ${maxRetries} attempts`);
}


async function fetchWithRetry(courseName: string, url: string, headers: Record<string, string>, maxRetries: number = 5, maxDelay: number = 19000, minDelay: number = 2000): Promise<Response> {
  // Add to headers to pretend this is from a safari browser
  headers["User-Agent"] = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15";
  headers["Accept"] = "application/json, text/plain, */*";
  headers["Accept-Language"] = "en-CA,en-US;q=0.9,en;q=0.8";
  headers["Accept-Encoding"] = "gzip, deflate, br";
  headers["Connection"] = "keep-alive";
  headers["Sec-Fetch-Dest"] = "empty";
  headers["Sec-Fetch-Mode"] = "cors";
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
          const response = await fetch(url, { headers: headers });
          if (!response.ok) {
            // Read the response body to get the actual error message
            let errorBody = '';
            try {
              errorBody = await response.text();
            } catch (e) {
              errorBody = 'Unable to read response body';
            }
            
            if (![429, 500, 503, 502].includes(response.status)) {
              console.error(`Error fetching ${courseName}: ${response.status} ${response.statusText} - ${errorBody}`);
            }
            throw new Error(`Error fetching ${courseName}: ${response.status} ${response.statusText} - ${errorBody}`);
          }
          return response;
      } catch (error) {
          if (attempt < maxRetries) {
              const delay = Math.floor(Math.random() * maxDelay) + minDelay; // Random delay between 1000-15000ms
              await new Promise(resolve => setTimeout(resolve, delay));
          }
          else{
            Sentry.captureException(error)
            throw new Error(`[${courseName}] Failed to fetch after ${maxRetries} attempts - ${error}`);
          }
      }
  }
  
  // This line should never be reached due to the throw in the else block, but TypeScript requires it
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

export function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}
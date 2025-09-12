import { Course } from "./Course.ts";
import { TeeTime } from "./TeeTime.ts";
import * as Sentry from 'https://deno.land/x/sentry/index.mjs'

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
            teeTimes: await fetchTeeTimesFromCPS(course.id, course.name, subdomain, params, headers, searchDate, course.requires_login)
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
    const response = await fetchWithRetry(courseName, url.toString(), headers, 5, 21000, 2000);
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

    for (const teeTimeObject of teeTimesList) {
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
        
        const startDateTime = new Date(teeTimeObject["startTime"]);
        const playersAvailable = teeTimeObject["availableParticipantNo"].length;
        const holes = parseInt(holesStr);
        const booking_link = `https://${subdomain}.cps.golf`
        const tee_time_id = courseId + startDateTime.toISOString().split('T')[0].replaceAll('-', '') + startDateTime.getHours() + startDateTime.getMinutes() + "-" + holesStr
        teeTimes.push(new TeeTime(startDateTime, playersAvailable, holes, price, booking_link, tee_time_id));
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
      const data = await response.json();
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
           const response = await fetchWithRetry(courseName, fullUrl, {}, 5, 5000, 1000);
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
       for (const teeTime of teeTimes) {
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
  
}
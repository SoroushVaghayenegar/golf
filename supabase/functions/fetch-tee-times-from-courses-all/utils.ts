import { Course } from "./Course.ts";
import { TeeTime } from "./TeeTime.ts";

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

const PROXIES = [
  "http://172.67.180.82:80",
  "http://104.16.87.91:80",
  "http://104.17.100.48:80",
  "http://172.67.177.57:80",
  "http://172.67.181.0:80",
  "http://104.16.75.19:80",
  "http://104.16.49.140:80",
  "http://104.16.31.4:80",
  "http://172.67.181.195:80",
  "http://172.67.177.223:80",
  "http://104.16.40.145:80",
  "http://104.16.254.132:80",
  "http://172.67.173.118:80",
  "http://172.67.176.77:80",
  "http://172.67.177.174:80",
  "http://172.67.180.50:80",
  "http://172.67.170.7:80",
  "http://104.16.76.78:80",
  "http://104.16.252.2:80",
  "http://104.16.57.230:80",
  "http://172.67.180.71:80",
  "http://172.67.176.9:80",
  "http://172.67.17.7:80",
  "http://172.67.176.227:80",
  "http://172.67.176.226:80",
  "http://104.16.244.206:80",
  "http://104.16.60.8:80",
  "http://104.16.4.69:80",
  "http://172.67.169.51:80",
  "http://104.16.37.45:80",
  "http://172.67.177.1:80",
  "http://104.16.230.127:80",
  "http://104.16.252.229:80",
  "http://104.16.243.71:80",
  "http://172.67.172.175:80",
  "http://172.67.175.165:80",
  "http://104.16.214.210:80",
  "http://172.67.167.162:80",
  "http://172.67.176.165:80",
  "http://104.16.245.237:80",
  "http://104.16.254.155:80",
]

function getRandomProxies(): Record<string, string> {
   const proxy = PROXIES[Math.floor(Math.random() * PROXIES.length)];
   return {"http": proxy, "https": proxy}
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
            const response = await fetch(url, { headers: headers, proxies: getRandomProxies() });
            if (!response.ok) {
              if (![429, 500, 503].includes(response.status)) {
                console.error(`Error fetching ${courseName}: ${response.status} ${response.statusText} ${response.body}`);
              }
                throw new Error(`Error fetching ${courseName}: ${response.status} ${response.statusText} ${response.body}`);
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
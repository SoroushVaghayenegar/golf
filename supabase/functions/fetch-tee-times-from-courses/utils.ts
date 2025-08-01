import { Course } from "./Course.ts";
import { TeeTime } from "./TeeTime.ts";

const CPS = "CPS"
const CHRONO_LIGHTSPEED = "CHRONO_LIGHTSPEED"

export function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

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
  
  const maxRetries = 5;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: headers
      });
      
      if (!response.ok) {
        const responseText = await response.text();
        if (response.status !== 429) {
            // Debug logging
            console.log('CPS Request Details:');
            console.log('URL:', url.toString());
            console.log('Headers:', headers);
            console.error(`CPS Response Error (Attempt ${attempt}/${maxRetries}):`);
            console.error('Status:', response.status);
            console.error('Status Text:', response.statusText);
            console.error('Response Body:', responseText);
        }
        throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
      }
      
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
        const playersAvailable = teeTimeObject["availableParticipantNo"];
        const holes = teeTimeObject["holes"];
        const price = teeTimeObject["shItemPrices"][0]["price"];
        const booking_link = `https://${subdomain}.cps.golf`
        teeTimes.push(new TeeTime(startDateTime, playersAvailable, holes, price, booking_link));
      }
      return teeTimes;

    } catch (error) {
    //   console.error(`Error fetching tee times from CPS (Attempt ${attempt}/${maxRetries}):`, error);
      
      // If this is not the last attempt, wait before retrying
      if (attempt < maxRetries) {
    //     console.log(`Waiting ${attempt} second(s) before retry...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 3000));
      }
    }
  }
  
  // If we've exhausted all retries, throw the last error, return empty array
  console.error(`[${courseName}] Failed to fetch tee times from CPS after ${maxRetries} attempts`);
  return [];
}


export async function fetchTeeTimesFromChronoLightspeed(club_id: number, course_id: number, affiliation_type_id: number, course_holes: number, searchDate: Date, clubLinkName: string): Promise<TeeTime[]> {
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
       
       const maxRetries = 3;
       
       for (let attempt = 1; attempt <= maxRetries; attempt++) {
           try {
               const response = await fetch(fullUrl);
               
               if (!response.ok) {
                   const responseText = await response.text();
                   console.error(`Lightspeed Response Error (Attempt ${attempt}/${maxRetries}):`);
                   console.error('URL:', fullUrl);
                   console.error('Status:', response.status);
                   console.error('Status Text:', response.statusText);
                   console.error('Response Body:', responseText);
                   throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
               }
               
               const teeTimes = await response.json();
               return { players, teeTimes };
               
           } catch (error) {
               console.error(`Error fetching tee times from Lightspeed for ${players} players (Attempt ${attempt}/${maxRetries}):`, error);
               
               // If this is not the last attempt, wait before retrying
               if (attempt < maxRetries) {
                   console.log(`Waiting ${attempt} second(s) before retry...`);
                   await new Promise(resolve => setTimeout(resolve, attempt * 1500));
               } else {
                   // If we've exhausted all retries, return empty tee times for this player count
                   console.error(`Failed to fetch tee times from Lightspeed for ${players} players after ${maxRetries} attempts`);
                   return { players, teeTimes: [] };
               }
           }
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


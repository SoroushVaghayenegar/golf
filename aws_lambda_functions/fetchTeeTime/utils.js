"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCourseTeeTimes = fetchCourseTeeTimes;
exports.fetchTeeTimesFromCPS = fetchTeeTimesFromCPS;
exports.fetchTeeTimesFromChronoLightspeed = fetchTeeTimesFromChronoLightspeed;
const TeeTime_1 = require("./TeeTime");
const https_proxy_agent_1 = require("https-proxy-agent");
const CPS = "CPS";
const CHRONO_LIGHTSPEED = "CHRONO_LIGHTSPEED";
async function fetchCourseTeeTimes(course, searchDate) {
    if (course.external_api === CPS) {
        const subdomain = course.external_api_attributes.subdomain;
        const params = course.external_api_attributes.params;
        const headers = course.external_api_attributes.headers;
        return {
            courseId: course.id,
            date: searchDate.toISOString().split('T')[0],
            teeTimes: await fetchTeeTimesFromCPS(course.name, subdomain, params, headers, searchDate)
        };
    }
    else if (course.external_api === CHRONO_LIGHTSPEED) {
        // For CHRONO/LIGHTSPEED, fetch tee times for each course_holes value
        const courseHolesArray = course.external_api_attributes.course_holes;
        const clubId = course.external_api_attributes.club_id;
        const courseId = course.external_api_attributes.course_id;
        const affiliationTypeId = course.external_api_attributes.affiliation_type_id;
        const clubLinkName = course.external_api_attributes.club_link_name;
        // Parallelize fetching for each course holes value
        const teeTimesPromises = courseHolesArray.map(holes => fetchTeeTimesFromChronoLightspeed(course.name, clubId, courseId, affiliationTypeId, holes, searchDate, clubLinkName));
        const teeTimesResults = await Promise.all(teeTimesPromises);
        const allTeeTimes = teeTimesResults.flat();
        return {
            courseId: course.id,
            date: searchDate.toISOString().split('T')[0],
            teeTimes: allTeeTimes
        };
    }
    else {
        throw new Error(`Unsupported external API: ${course.external_api}`);
    }
}
async function fetchTeeTimesFromCPS(courseName, subdomain, params, headers, searchDate) {
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
        if (typeof teeTimesList === "object" &&
            !Array.isArray(teeTimesList) &&
            teeTimesList !== null &&
            teeTimesList["messageKey"] === "NO_TEETIMES") {
            return [];
        }
        const teeTimes = [];
        for (const teeTimeObject of teeTimesList) {
            // turn time from "%Y-%m-%dT%H:%M:%S"
            const startDateTime = new Date(teeTimeObject["startTime"]);
            const playersAvailable = teeTimeObject["availableParticipantNo"].length;
            const holes = teeTimeObject["holes"];
            const price = teeTimeObject["shItemPrices"][0]["price"];
            const booking_link = `https://${subdomain}.cps.golf`;
            teeTimes.push(new TeeTime_1.TeeTime(startDateTime, playersAvailable, holes, price, booking_link));
        }
        return teeTimes;
    }
    catch (error) {
        console.error(error);
        console.error(`[${courseName}] Failed to fetch tee times from CPS after retries`);
        return [];
    }
}
async function fetchTeeTimesFromChronoLightspeed(courseName, club_id, course_id, affiliation_type_id, course_holes, searchDate, clubLinkName) {
    // format to '%Y-%m-%d'
    const dateString = searchDate.toISOString().split('T')[0];
    const baseUrl = `https://www.chronogolf.com/marketplace/clubs/${club_id}/teetimes?date=${dateString}&course_id=${course_id}&nb_holes=${course_holes}`;
    const teeTimesMap = new Map();
    // Parallelize fetching for different player counts
    const playerCounts = [4, 3, 2, 1];
    const fetchPromises = playerCounts.map(async (players) => {
        let fullUrl = baseUrl;
        for (let i = 0; i < players; i++) {
            fullUrl += `&affiliation_type_ids%5B%5D=${affiliation_type_id}`;
        }
        try {
            const response = await fetchWithRetry(courseName, fullUrl, {}, 5, 6000, 1000);
            const teeTimes = await response.json();
            return { players, teeTimes };
        }
        catch (error) {
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
    const teeTimes = [];
    for (const teeTime of teeTimesMap.values()) {
        const startDateTime = new Date(teeTime["date"] + "T" + teeTime["start_time"]);
        const playersAvailable = teeTime["green_fees"].length;
        const price = teeTime["green_fees"][0]["green_fee"];
        const bookingLink = getChronoLightspeedBookingLink(clubLinkName, course_id, course_holes, searchDate, affiliation_type_id, playersAvailable, teeTime["id"]);
        teeTimes.push(new TeeTime_1.TeeTime(startDateTime, playersAvailable, course_holes, price, bookingLink));
    }
    return teeTimes;
}
function getChronoLightspeedBookingLink(clubLinkName, courseId, nbHoles, date, affiliationTypeId, numberOfPlayers, teetimeId) {
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
];
// Global counter for proxy rotation
let proxyIndex = 0;
function getNextProxy() {
    // Atomic-ish increment and return
    const index = proxyIndex++;
    return PROXIES[index % PROXIES.length];
}
async function fetchWithRetry(courseName, url, headers, maxRetries = 5, maxDelay = 19000, minDelay = 2000) {
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
            let fetchOptions = { headers: headers };
            if (proxy !== null) {
                fetchOptions.agent = new https_proxy_agent_1.HttpsProxyAgent(proxy);
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
                }
                catch (bodyError) {
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
        }
        catch (error) {
            if (attempt < maxRetries) {
                const delay = Math.floor(Math.random() * maxDelay) + minDelay; // Random delay between 1000-15000ms
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw new Error(`[${courseName}] Failed to fetch after ${maxRetries} attempts`);
}

import { Course, CPSAttributes, RawTeeTime, FetchResult, CPSApiTeeTime, CPSShItemPrice } from "./types";
import { randomUUID } from "crypto";

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-CA,en-US;q=0.9,en;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "Connection": "keep-alive",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
};

interface CPSLoginCredentials {
  username: string;
  password: string;
}

const CPS_CREDENTIALS: CPSLoginCredentials = {
  username: "account@teeclub.golf",
  password: "TeeclubAdmin1!",
};

async function getAccessToken(subdomain: string, headers: Record<string, string>): Promise<string> {
  const loginUrl = `https://${subdomain}.cps.golf/identityapi/connect/token`;
  const loginParams = {
    grant_type: "password",
    username: CPS_CREDENTIALS.username,
    password: CPS_CREDENTIALS.password,
    client_id: "js1",
    client_secret: "v4secret",
  };

  const response = await fetch(loginUrl, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(loginParams).toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to get CPS access token: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function registerTransactionId(subdomain: string, headers: Record<string, string>): Promise<string> {
  const transactionId = randomUUID();
  const url = `https://${subdomain}.cps.golf/onlineres/onlineapi/api/v1/onlinereservation/RegisterTransactionId`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ transactionId }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to register transaction ID: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  return transactionId;
}

export async function fetchCPSTeeTimes(
  course: Course,
  searchDate: Date,
  numOfPlayers: string,
  holes: string
): Promise<FetchResult> {
  const attrs = course.external_api_attributes as CPSAttributes;
  const subdomain = attrs.subdomain;
  const params = { ...attrs.params };
  const headers: Record<string, string> = { ...attrs.headers, ...BROWSER_HEADERS };
  const dateString = searchDate.toISOString().split("T")[0];

  try {
    // Handle login if required
    if (course.requires_login) {
      const accessToken = await getAccessToken(subdomain, headers);
      headers["authorization"] = `Bearer ${accessToken}`;
    }

    // Register transaction ID if required
    if (attrs.needsTransactionId) {
      const transactionId = await registerTransactionId(subdomain, headers);
      params["transactionId"] = transactionId;
    }

    // Build URL with search date
    const url = new URL(`https://${subdomain}.cps.golf/onlineres/onlineapi/api/v1/onlinereservation/TeeTimes`);
    url.searchParams.append("searchDate", searchDate.toDateString());
    url.searchParams.append("holes", holes);
    url.searchParams.append("numberOfPlayer", numOfPlayers);
    
    // Add other params from course config
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value.toString());
    });

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "Unable to read response");
      return {
        courseId: course.id,
        course,
        date: dateString,
        teeTimes: [],
        error: `CPS API error: ${response.status} - ${errorBody.substring(0, 200)}`,
      };
    }

    let teeTimesList = await response.json();

    // Unwrap response if needed
    if (
      typeof teeTimesList === "object" &&
      !Array.isArray(teeTimesList) &&
      teeTimesList !== null &&
      "isSuccess" in teeTimesList &&
      "content" in teeTimesList
    ) {
      teeTimesList = teeTimesList.content;
    }

    // Handle NO_TEETIMES response
    if (
      typeof teeTimesList === "object" &&
      !Array.isArray(teeTimesList) &&
      teeTimesList !== null &&
      teeTimesList["messageKey"] === "NO_TEETIMES"
    ) {
      return { courseId: course.id, course, date: dateString, teeTimes: [] };
    }
    
    const teeTimes: RawTeeTime[] = [];
    const numOfPlayersInt = parseInt(numOfPlayers);
    const holesInt = parseInt(holes);

    for (const teeTimeObject of teeTimesList as CPSApiTeeTime[]) {
      // Get available participants
      const availableParticipants = Array.from(
        { length: teeTimeObject["maxPlayer"] - teeTimeObject["minPlayer"] + 1 },
        (_, i) => teeTimeObject["minPlayer"] + i
      );

      // Filter by numOfPlayers
      if (!availableParticipants.includes(numOfPlayersInt)) {
        continue;
      }

      // Get price
      const price = 
        teeTimeObject["shItemPrices"]?.find((p: CPSShItemPrice) => p.shItemCode === `GreenFee${holes}`)?.currentPrice ||
        teeTimeObject["shItemPrices"]?.find((p: CPSShItemPrice) => p.shItemCode === `Package${holes}`)?.currentPrice ||
        teeTimeObject["shItemPrices"]?.find((p: CPSShItemPrice) => p.shItemCode === `GreenFee${holes}Online`)?.currentPrice ||
        0;

      // CPS returns local time (e.g., "2025-11-27T10:30:00") - don't treat it as UTC
      const startDateTimeStr = teeTimeObject["startTime"]; // Keep as local time string
      const playersAvailable = teeTimeObject["availableParticipantNo"].length;
      const startingTee = teeTimeObject["startingTee"] || 1;
      const bookingLink = `https://${subdomain}.cps.golf`;

      // Parse date and time parts for ID generation
      const [datePart, timePart] = startDateTimeStr.split("T");
      const [hours, minutes] = timePart.split(":");
      const teeTimeId = `${course.id}${datePart.replace(/-/g, "")}${hours}${minutes}-${holes}-${startingTee}`;

      teeTimes.push({
        tee_time_id: teeTimeId,
        start_datetime: startDateTimeStr,
        players_available: playersAvailable,
        available_participants: availableParticipants,
        holes: holesInt,
        price,
        booking_link: bookingLink,
        booking_links: { [playersAvailable]: bookingLink },
        starting_tee: startingTee,
      });
    }

    return { courseId: course.id, course, date: dateString, teeTimes };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      courseId: course.id,
      course,
      date: dateString,
      teeTimes: [],
      error: `CPS fetch failed: ${errorMessage}`,
    };
  }
}


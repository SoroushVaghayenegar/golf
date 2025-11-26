import { Course, ChronoAttributes, RawTeeTime, FetchResult, ChronoApiTeeTime } from "./types";

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15",
  "Accept": "application/json",
  "Accept-Language": "en-CA,en-US;q=0.9,en;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "Connection": "keep-alive",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
};

function getChronoBookingLink(
  clubLinkName: string,
  courseId: number,
  nbHoles: number,
  date: Date,
  affiliationTypeId: number,
  numberOfPlayers: number,
  teetimeId: number
): string {
  const dateStr = date.toISOString().split("T")[0];
  const affiliationTypeIds = Array(numberOfPlayers).fill(affiliationTypeId).join(",");
  return `https://www.chronogolf.ca/club/${clubLinkName}/booking/?source=club&medium=widget#/teetime/review?course_id=${courseId}&nb_holes=${nbHoles}&date=${dateStr}&affiliation_type_ids=${affiliationTypeIds}&teetime_id=${teetimeId}&is_deal=false&new_user=false`;
}

function getChronoBookingLinks(
  clubLinkName: string,
  courseId: number,
  nbHoles: number,
  date: Date,
  affiliationTypeId: number,
  availableParticipants: number[],
  teetimeId: number
): { [key: number]: string } {
  const bookingLinks: { [key: number]: string } = {};
  for (const numPlayers of availableParticipants) {
    bookingLinks[numPlayers] = getChronoBookingLink(
      clubLinkName,
      courseId,
      nbHoles,
      date,
      affiliationTypeId,
      numPlayers,
      teetimeId
    );
  }
  return bookingLinks;
}

export async function fetchChronoTeeTimes(
  course: Course,
  searchDate: Date,
  numOfPlayers: string,
  holes: string
): Promise<FetchResult> {
  const attrs = course.external_api_attributes as ChronoAttributes;
  const { club_id, course_id, affiliation_type_id, club_link_name, course_holes } = attrs;
  const dateString = searchDate.toISOString().split("T")[0];

  try {
    const nbHoles = parseInt(holes);
    const numPlayersInt = parseInt(numOfPlayers);

    // Check if the course supports the requested hole configuration
    if (!course_holes.includes(nbHoles)) {
      return { courseId: course.id, course, date: dateString, teeTimes: [] };
    }

    const url = new URL(`https://www.chronogolf.ca/marketplace/clubs/${club_id}/teetimes`);
    url.searchParams.append("date", dateString);
    url.searchParams.append("course_id", course_id.toString());
    url.searchParams.append("nb_holes", holes);
    
    // Add affiliation_type_ids for each player
    for (let i = 0; i < numPlayersInt; i++) {
      url.searchParams.append("affiliation_type_ids[]", affiliation_type_id.toString());
    }

    const headers = {
      ...BROWSER_HEADERS,
      "Referer": `https://www.chronogolf.com/en/club/${club_id}/widget?medium=widget&source=club`,
    };

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "Unable to read response");
      return {
        courseId: course.id,
        course,
        date: dateString,
        teeTimes: [],
        error: `Chrono API error: ${response.status} - ${errorBody.substring(0, 200)}`,
      };
    }

    const teeTimesData = await response.json();
    const teeTimes: RawTeeTime[] = [];

    // Process response
    for (const teeTime of teeTimesData as ChronoApiTeeTime[]) {
      if (teeTime["out_of_capacity"] || teeTime["restrictions"]?.length > 0) {
        continue;
      }

      const startDateTimeStr = `${teeTime["date"]}T${teeTime["start_time"]}`;
      const playersAvailable = teeTime["green_fees"].length;
      const availableParticipants = [playersAvailable];
      const price = teeTime["green_fees"][0]?.["green_fee"] || 0;

      const teeTimeId = `${course.id}${teeTime["date"].replace(/-/g, "")}${teeTime["start_time"].replace(/:/g, "")}-${nbHoles}`;

      const bookingLinks = getChronoBookingLinks(
        club_link_name,
        course_id,
        nbHoles,
        searchDate,
        affiliation_type_id,
        availableParticipants,
        teeTime["id"]
      );

      const bookingLink = getChronoBookingLink(
        club_link_name,
        course_id,
        nbHoles,
        searchDate,
        affiliation_type_id,
        playersAvailable,
        teeTime["id"]
      );

      teeTimes.push({
        tee_time_id: teeTimeId,
        start_datetime: startDateTimeStr,
        players_available: playersAvailable,
        available_participants: availableParticipants,
        holes: nbHoles,
        price,
        booking_link: bookingLink,
        booking_links: bookingLinks,
      });
    }

    // Sort by start time
    teeTimes.sort((a, b) => 
      new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
    );

    return { courseId: course.id, course, date: dateString, teeTimes };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      courseId: course.id,
      course,
      date: dateString,
      teeTimes: [],
      error: `Chrono fetch failed: ${errorMessage}`,
    };
  }
}


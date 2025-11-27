import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Course, FetchResult, ForecastData, TeeTime, CourseInfo } from "./types";
import { fetchCPSTeeTimes } from "./cps";
import { fetchChronoTeeTimes } from "./chrono";
import { fetchForecasts, getWeatherData } from "./weather";

interface FetchError {
  courseId: number;
  courseName: string;
  date: string;
  error: string;
}

interface SSEMessage {
  type: "progress" | "complete" | "error";
  progress?: {
    completed: number;
    total: number;
    currentCourses?: string[];
  };
  teeTimes?: TeeTime[];
  error?: string;
}

function parseToMinutes(timeStr: string | null): number | null {
  if (!timeStr) return null;
  const parts = timeStr.split(":");
  if (parts.length !== 2) return null;
  const hour = Number(parts[0]);
  const minute = Number(parts[1]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
}

function getCurrentDate(timezone: string): string {
  const date = new Date(new Date().toLocaleString("en-US", { timeZone: timezone }));
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentTime24HourFormat(timezone: string): string {
  return new Date().toLocaleTimeString("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function isTeeTimeInTimeRange(
  teeTimeTime: string,
  startTime: string | null,
  endTime: string | null
): boolean {
  const teeMinutes = parseToMinutes(teeTimeTime);
  if (teeMinutes === null) return false;

  const startMinutes = parseToMinutes(startTime);
  const endMinutes = parseToMinutes(endTime);

  if (startMinutes === null && endMinutes === null) return true;
  if (startMinutes !== null && endMinutes === null) return teeMinutes >= startMinutes;
  if (startMinutes === null && endMinutes !== null) return teeMinutes <= endMinutes;
  if (startMinutes! > endMinutes!) return false;

  return teeMinutes >= startMinutes! && teeMinutes <= endMinutes!;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const datesParam = searchParams.get("dates");
    const numOfPlayers = searchParams.get("numOfPlayers");
    const holes = searchParams.get("holes");
    const regionId = searchParams.get("region_id");
    const courseIdsParam = searchParams.get("courseIds");
    const startTimeParam = searchParams.get("startTime");
    const endTimeParam = searchParams.get("endTime");

    // Validate required params
    if (!datesParam) {
      return new Response(JSON.stringify({ error: "dates parameter is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!regionId) {
      return new Response(JSON.stringify({ error: "region_id parameter is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!numOfPlayers || !["1", "2", "3", "4"].includes(numOfPlayers)) {
      return new Response(
        JSON.stringify({ error: "numOfPlayers parameter is required and must be 1, 2, 3, or 4" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!holes || !["9", "18"].includes(holes)) {
      return new Response(
        JSON.stringify({ error: "holes parameter is required and must be 9 or 18" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const dates = datesParam.split(",").map((d) => d.trim());
    const courseIds = courseIdsParam
      ? courseIdsParam.split(",").map((id) => parseInt(id.trim()))
      : [];

    // Format time params
    const startTime = startTimeParam ? `${startTimeParam.padStart(2, "0")}:00` : null;
    const endTime = endTimeParam ? `${endTimeParam.padStart(2, "0")}:00` : null;

    // Create Supabase client
    const supabase = await createClient();

    // Get region timezone
    const { data: regionData, error: regionError } = await supabase
      .from("regions")
      .select("timezone")
      .eq("id", regionId)
      .single();

    if (regionError || !regionData) {
      return new Response(JSON.stringify({ error: "Region not found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const regionTimezone = regionData.timezone;

    // Fetch courses from Supabase
    let coursesQuery = supabase
      .from("courses")
      .select(`
        id,
        name,
        display_name,
        club_name,
        rating,
        city_id,
        external_api,
        external_api_attributes,
        booking_visibility_days,
        requires_login,
        booking_visibility_start_time,
        timezone,
        latitude,
        longitude,
        address,
        phone_number,
        slug,
        cities!inner(
          id,
          name,
          latitude,
          longitude,
          region_id
        )
      `)
      .eq("cities.region_id", regionId);

    // Filter by course IDs if provided
    if (courseIds.length > 0) {
      coursesQuery = coursesQuery.in("id", courseIds);
    }

    const { data: coursesData, error: coursesError } = await coursesQuery;

    if (coursesError) {
      console.error("Error fetching courses:", coursesError);
      return new Response(JSON.stringify({ error: "Failed to fetch courses" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!coursesData || coursesData.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const allCourses = coursesData as unknown as Course[];

    // Filter courses by holes - only include courses that support the requested hole configuration
    const holesInt = parseInt(holes);
    const courses = allCourses.filter(course => {
      const attrs = course.external_api_attributes;
      const courseHoles = (attrs as { course_holes?: number[] }).course_holes;
      
      // If no course_holes array is defined, assume the course supports all hole configurations
      if (!courseHoles || !Array.isArray(courseHoles)) {
        return true;
      }
      
      return courseHoles.includes(holesInt);
    });

    // Build list of all course/date tasks
    const tasks: { course: Course; date: string }[] = [];
    for (const course of courses) {
      if (course.external_api !== "CPS" && course.external_api !== "CHRONO_LIGHTSPEED") {
        console.warn(`Unknown external_api: ${course.external_api} for course ${course.name}`);
        continue;
      }
      for (const date of dates) {
        tasks.push({ course, date });
      }
    }

    // Get unique courses for counting
    const uniqueCourses = [...new Set(tasks.map((t) => t.course.id))];
    const totalCourses = uniqueCourses.length;

    // Collect unique city IDs for forecast fetching
    const cityIds = [...new Set(courses.map((c) => c.city_id))];

    // Fetch forecasts
    const forecasts = await fetchForecasts(supabase, cityIds, dates);

    // Create forecast lookup map
    const forecastMap = new Map<string, ForecastData>();
    for (const forecast of forecasts) {
      const key = `${forecast.city_id}-${forecast.date}`;
      forecastMap.set(key, forecast);
    }

    // Get current date/time in region timezone for filtering
    const currentDate = getCurrentDate(regionTimezone);
    const currentTime = getCurrentTime24HourFormat(regionTimezone);

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendMessage = (message: SSEMessage) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
        };

        const allResults: FetchResult[] = [];
        const allErrors: FetchError[] = [];
        const completedCourseIds = new Set<number>();

        // Send initial progress
        sendMessage({
          type: "progress",
          progress: { completed: 0, total: totalCourses },
        });

        // Process tasks with concurrency of 4
        const CONCURRENCY = 4;
        for (let i = 0; i < tasks.length; i += CONCURRENCY) {
          const batch = tasks.slice(i, i + CONCURRENCY);

          // Get unique course names being fetched in this batch
          const batchCourseNames = [...new Set(batch.map(t => t.course.display_name))];

          // Send progress with all courses being fetched in this batch
          sendMessage({
            type: "progress",
            progress: {
              completed: completedCourseIds.size,
              total: totalCourses,
              currentCourses: batchCourseNames,
            },
          });

          const batchResults = await Promise.all(
            batch.map(async ({ course, date }) => {
              const searchDate = new Date(date + "T00:00:00");

              let result: FetchResult;
              if (course.external_api === "CPS") {
                result = await fetchCPSTeeTimes(course, searchDate, numOfPlayers, holes);
              } else {
                result = await fetchChronoTeeTimes(course, searchDate, numOfPlayers, holes);
              }

              return { result, course, date };
            })
          );

          for (const { result, course, date } of batchResults) {
            if (result.error) {
              allErrors.push({
                courseId: course.id,
                courseName: course.name,
                date,
                error: result.error,
              });
            }

            if (result.teeTimes.length > 0) {
              allResults.push(result);
            }

            // Track completed courses
            if (!completedCourseIds.has(course.id)) {
              completedCourseIds.add(course.id);
            }
          }
        }

        // Transform results to TeeTime format with weather data
        const teeTimes: TeeTime[] = [];

        for (const result of allResults) {
          const course = result.course;
          const forecast = forecastMap.get(`${course.city_id}-${result.date}`);

          for (const rawTeeTime of result.teeTimes) {
            // Parse start time
            const startDateTimeStr = rawTeeTime.start_datetime.includes("T")
              ? rawTeeTime.start_datetime
              : `${result.date}T${rawTeeTime.start_datetime}`;

            const startDateTime = new Date(startDateTimeStr);
            const teeTimeStartTime = startDateTime.toTimeString().slice(0, 5); // HH:MM format

            // Determine effective start time for filtering (use current time if today)
            let effectiveStartTime = startTime;
            if (result.date === currentDate) {
              if (!effectiveStartTime || parseToMinutes(currentTime)! > parseToMinutes(effectiveStartTime)!) {
                effectiveStartTime = currentTime;
              }
            }

            // Filter by time range
            if (!isTeeTimeInTimeRange(teeTimeStartTime, effectiveStartTime, endTime)) {
              continue;
            }

            // Get weather data
            const weather = getWeatherData(forecast, teeTimeStartTime);

            // Build course info
            const courseInfo: CourseInfo = {
              name: course.name,
              display_name: course.display_name,
              club_name: course.club_name,
              rating: course.rating,
              city: course.cities.name,
              latitude: course.latitude,
              longitude: course.longitude,
              address: course.address,
              phone_number: course.phone_number,
              slug: course.slug,
            };

            const teeTime: TeeTime = {
              id: rawTeeTime.tee_time_id,
              start_date: result.date,
              start_time: teeTimeStartTime,
              start_datetime: startDateTimeStr.replace(":00.000Z", "").replace("Z", ""),
              players_available: rawTeeTime.players_available,
              available_participants: rawTeeTime.available_participants,
              course_id: course.id,
              course_name: course.display_name,
              rating: course.rating,
              holes: rawTeeTime.holes,
              price: rawTeeTime.price,
              starting_tee: rawTeeTime.starting_tee ?? 1,
              city: course.cities.name,
              booking_link: rawTeeTime.booking_link,
              booking_links: rawTeeTime.booking_links,
              ...weather,
              course: courseInfo,
            };

            teeTimes.push(teeTime);
          }
        }

        // Sort by start_datetime
        teeTimes.sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());

        // Log errors if any (but still return partial results)
        if (allErrors.length > 0) {
          console.warn(`Tee times fetch completed with ${allErrors.length} errors:`, allErrors);
        }

        // Send final complete message with all tee times
        sendMessage({
          type: "complete",
          teeTimes,
          progress: { completed: totalCourses, total: totalCourses },
        });

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error fetching tee times:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

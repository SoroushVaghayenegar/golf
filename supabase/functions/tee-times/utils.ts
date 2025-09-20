import { SupabaseClient } from "@supabase/supabase-js";

// Define interfaces for better type safety
interface CourseData {
    id: number;
    name: string;
    display_name: string;
    club_name: string;
    rating: number;
    city_id: number;
    cities: {
        id: number;
        name: string;
        latitude: number;
        longitude: number;
    };
    latitude: number;
    longitude: number;
    address: string;
    phone_number: string;
}

interface TeeTimeData {
    start_datetime: string;
    players_available: string | number;
    available_participants: number[];
    holes: number;
    price: number;
    booking_link: string;
    booking_links: { [key: number]: string };
}

interface CourseTeeTimes {
    id: number;
    course_id: number;
    date: string;
    tee_times_data: TeeTimeData[];
    tee_times_count: number;
    courses: CourseData;
}

interface ForecastData {
    city_id: number;
    date: string;
    [key: string]: {
        data: number[];
    } | number | string;
}

interface CourseInfo {
    name: string;
    display_name: string;
    club_name: string;
    rating: number;
    city: string;
    latitude: number;
    longitude: number;
    address: string;
    phone_number: string;
}

export interface TeeTime {
    id: string;
    start_date: string;
    start_time: string;
    start_datetime: string;
    players_available: number;
    course_id: number;
    course_name: string;
    holes: number;
    starting_tee: number;
    price: number;
    city: string;
    booking_link: string | null;
    booking_links: { [key: number]: string };
    rating: number | null;
    temperature: number | null;
    precipitation_probability: number | null;
    weather_code: string | null;
    wind_speed: number | null;
    wind_gusts: number | null;
    cloud_cover: number | null;
    uv_index: number | null;
    precipitation: number | null;
    course: CourseInfo;
}

export async function getTeeTimes(supabaseClient: SupabaseClient, dates: string[], startTime: string | null, endTime: string | null, numOfPlayers: string | null, holes: string | null, courseIds: number[], region_id: string, regionTimeZone: string) {
    if (courseIds.length === 0) {
        const { data: coursesData, error } = await supabaseClient
        .from('courses_view')
        .select('*')
        .eq('region_id', parseInt(region_id));

        if (error) {
            return { data: null, error: error }
        }

        courseIds = coursesData.map(course => course.id)
        if (courseIds.length === 0) {
            return { data: [], error: null }
        }
    }

    let query = supabaseClient
        .from('tee_times')
        .select(`
            id,
            course_id,
            date,
            tee_times_data,
            tee_times_count,
            courses!inner(
                id,
                name,
                display_name,
                club_name,
                rating,
                city_id,
                cities(
                    id,
                    name,
                    latitude,
                    longitude
                ),
                latitude,
                longitude,
                address,
                phone_number
            )
        `)
        .in('date', dates)

    // Add course filter if provided
    if (courseIds.length > 0) {
        query = query.in('course_id', courseIds)
    }

    const { data: courseTeeTimesListData, error: teeTimesError } = await query

    if (teeTimesError) {
        return { data: null, error: teeTimesError }
    }

    // Get forecasts for the same cities and dates
    const cityIds = [...new Set(courseTeeTimesListData?.map(tt => (tt.courses as unknown as CourseData).city_id) || [])]
    
    const { data: forecastsData, error: forecastsError } = await supabaseClient
        .from('forecasts')
        .select('*')
        .in('city_id', cityIds)
        .in('date', dates)

    if (forecastsError) {
        console.warn('Failed to fetch forecasts:', forecastsError)
        // Continue without forecasts rather than failing completely
    }

    // Merge forecast data with tee times
    const result: TeeTime[] = []
    
    courseTeeTimesListData?.forEach((courseTeeTimes: unknown) => {
        const typedCourseTeeTimes = courseTeeTimes as CourseTeeTimes;
        const cityId = typedCourseTeeTimes.courses.city_id
        const forecast = forecastsData?.find(f => 
            f.city_id === cityId && f.date === typedCourseTeeTimes.date
        ) as ForecastData | undefined
        
        typedCourseTeeTimes.tee_times_data.forEach((teeTime: TeeTimeData) => {
            if ((numOfPlayers !== "any" && !teeTime.available_participants.includes(parseInt(numOfPlayers))) || (holes !== "any" && teeTime.holes.toString() !== holes)){
                return;
            }
            
            const teeTimeStartTimeString = teeTime.start_datetime.replace(".000Z", "")
            const teeTimeStartDatetime = new Date(teeTimeStartTimeString)
            const teetimeStartTime = teeTimeStartDatetime.toTimeString().slice(0, 5) // HH:MM format
            
            // Get current date and time in the regionTimeZone
            const currentDate = getCurrentDate(regionTimeZone);

            // currentTime is in format HH:MM, no am/pm , its 24 hour format
            const currentTime = getCurrentTime24HourFormat(regionTimeZone);
            
            let startTimeToUse = startTime;
            if (!startTimeToUse) {
                startTimeToUse = currentTime;
            }
            else if (typedCourseTeeTimes.date === currentDate) {
                if (parseToMinutes(currentTime) > parseToMinutes(startTime)) {
                    
                    startTimeToUse = currentTime;
                }
            }

            // If startTime is present, choose startTime as the smaller of startTime and CurrentTime in the regionTimeZone, otherwise choose startTime as CurrentTime in the regionTimeZone
            if (typedCourseTeeTimes.date === currentDate) {
                console.log("startTimeToUse", startTimeToUse)
            }
            
            if (!isTeeTimeInTimeRange(regionTimeZone, teetimeStartTime, startTimeToUse, endTime)) {
                return;
            }

            const courseInfo: CourseInfo = {
                name: typedCourseTeeTimes.courses.name,
                display_name: typedCourseTeeTimes.courses.display_name,
                club_name: typedCourseTeeTimes.courses.club_name,
                rating: typedCourseTeeTimes.courses.rating,
                city: typedCourseTeeTimes.courses.cities.name,
                latitude: typedCourseTeeTimes.courses.latitude,
                longitude: typedCourseTeeTimes.courses.longitude,
                address: typedCourseTeeTimes.courses.address,
                phone_number: typedCourseTeeTimes.courses.phone_number
            }

            const teeTimeObj: TeeTime = {
                id: teeTime.tee_time_id,
                start_date: typedCourseTeeTimes.date,
                start_time: teetimeStartTime,
                start_datetime: teeTimeStartTimeString,
                players_available: typeof teeTime.players_available === 'string' ? parseInt(teeTime.players_available) : teeTime.players_available,
                available_participants: teeTime.available_participants,
                course_id: typedCourseTeeTimes.course_id,
                course_name: typedCourseTeeTimes.courses.display_name,
                rating: typedCourseTeeTimes.courses.rating,
                holes: teeTime.holes,
                price: teeTime.price,
                starting_tee: teeTime.starting_tee ?? 1,
                city: typedCourseTeeTimes.courses.cities.name,
                booking_link: teeTime.booking_link,
                booking_links: teeTime.booking_links ?? null,
                temperature: getForecastNumber(forecast, 'temperature_2m', teetimeStartTime),
                precipitation_probability: getForecastNumber(forecast, 'precipitation_probability', teetimeStartTime),
                weather_code: getWeatherDescription(getForecastNumber(forecast, 'weather_code', teetimeStartTime)),
                wind_speed: getForecastNumber(forecast, 'wind_speed_10m', teetimeStartTime),
                wind_gusts: getForecastNumber(forecast, 'wind_gusts_10m', teetimeStartTime),
                cloud_cover: getForecastNumber(forecast, 'cloud_cover', teetimeStartTime),
                uv_index: getForecastNumber(forecast, 'uv_index', teetimeStartTime),
                precipitation: getForecastNumber(forecast, 'precipitation', teetimeStartTime),
                course: courseInfo
            }
            
            result.push(teeTimeObj)
        })
    })
    
    // Sort result by start_datetime ascending
    result.sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
    
    return { data: result, error: null }
}

function getCurrentDate(regionTimeZone: string): string {
    const date = new Date(new Date().toLocaleString("en-US", { timeZone: regionTimeZone }));

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getCurrentTime24HourFormat(regionTimeZone: string): string {
    return new Date().toLocaleTimeString('en-US', { timeZone: regionTimeZone, hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Extracts a forecast numeric value based on start_time from hourly data
 * @param forecastData - The forecast object containing the metric
 * @param metricName - The name of the metric (e.g., "temperature_2m")
 * @param startTime - The start time in HH:MM format
 * @returns The forecast numeric value, or null if not available
 */
function getForecastNumber(forecastData: ForecastData | undefined, metricName: string, startTime: string): number | null {
    if (!forecastData || !forecastData[metricName] || !startTime) {
        return null;
    }

    const metric = forecastData[metricName];
    if (!metric || typeof metric !== 'object' || !('data' in metric) || !Array.isArray(metric.data) || metric.data.length !== 24) {
        return null;
    }

    // Parse hour and minute from start_time (HH:MM format)
    const [hourStr, minuteStr] = startTime.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        return null;
    }

    // Determine which hour to use based on the rule:
    // If time is between hour:00 and hour:30, use that hour
    // If time is after hour:30, use the next hour
    let targetHour = hour;
    if (minute > 30) {
        targetHour = (hour + 1) % 24; // Handle wrap-around for hour 23
    }

    const value = metric.data[targetHour];

    return value !== null && value !== undefined ? Number(value) : null;
}

/**
 * Maps weather code to descriptive string
 * @param weatherCode - The numeric weather code
 * @returns The weather description string
 */
function getWeatherDescription(weatherCode: number | null): string | null {
    if (weatherCode === null || weatherCode === undefined) {
        return null;
    }

    const weatherCodeMap: { [key: number]: string } = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Depositing rime fog",
        51: "Drizzle: Light intensity",
        53: "Drizzle: Moderate intensity",
        55: "Drizzle: Dense intensity",
        56: "Freezing Drizzle: Light intensity",
        57: "Freezing Drizzle: Dense intensity",
        61: "Rain: Slight intensity",
        63: "Rain: Moderate intensity",
        65: "Rain: Heavy intensity",
        66: "Freezing Rain: Light intensity",
        67: "Freezing Rain: Heavy intensity",
        71: "Snow fall: Slight intensity",
        73: "Snow fall: Moderate intensity",
        75: "Snow fall: Heavy intensity",
        77: "Snow grains",
        80: "Rain showers: Slight intensity",
        81: "Rain showers: Moderate intensity",
        82: "Rain showers: Violent intensity",
        85: "Snow showers: Slight intensity",
        86: "Snow showers: Heavy intensity",
        95: "Thunderstorm: Slight or moderate",
        96: "Thunderstorm with slight hail",
        99: "Thunderstorm with heavy hail"
    };

    return weatherCodeMap[weatherCode] || `Unknown weather code: ${weatherCode}`;
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

function isTeeTimeInTimeRange(regionTimeZone: string, teeTimeTime: string, startTime: string | null, endTime: string | null): boolean {
    // teeTimeTime is in format HH:MM
    // startTime and endTime are in format HH:MM


    const teeMinutes = parseToMinutes(teeTimeTime);
    if (teeMinutes === null) return false;

    const startMinutes = parseToMinutes(startTime);
    const endMinutes = parseToMinutes(endTime);

    // If neither bound provided, include all tee times
    if (startMinutes === null && endMinutes === null) return true;

    // Only start bound provided: tee >= start
    if (startMinutes !== null && endMinutes === null) {
        return teeMinutes >= startMinutes;
    }

    // Only end bound provided: tee <= end
    if (startMinutes === null && endMinutes !== null) {
        return teeMinutes <= endMinutes;
    }

    // Both bounds provided within the same day
    if ((startMinutes as number) > (endMinutes as number)) {
        // Invalid range for same-day window
        return false;
    }
    return teeMinutes >= (startMinutes as number) && teeMinutes <= (endMinutes as number);
}
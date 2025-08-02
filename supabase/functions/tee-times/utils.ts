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
}

interface TeeTimeData {
    start_datetime: string;
    players_available: string | number;
    holes: number;
    price: number;
    booking_link: string;
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

export interface TeeTime {
    start_date: string;
    start_time: string;
    start_datetime: string;
    players_available: number;
    course_name: string;
    holes: number;
    price: number;
    city: string;
    booking_link: string | null;
    rating: number | null;
    temperature: number | null;
    precipitation_probability: number | null;
    weather_code: string | null;
    wind_speed: number | null;
    wind_gusts: number | null;
    cloud_cover: number | null;
    uv_index: number | null;
    precipitation: number | null;
}

export async function getTeeTimes(supabaseClient: SupabaseClient, dates: string[], numOfPlayers: string | null, holes: string | null, courseIds: number[], region: string) {
    if (courseIds.length === 0) {
        const { data: coursesData, error } = await supabaseClient
        .from('courses_view')
        .select('*')
        .ilike('region_name', region);

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
                )
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
            if ((numOfPlayers !== "any" && teeTime.players_available.toString() !== numOfPlayers) || (holes !== "any" && teeTime.holes.toString() !== holes)){
                return;
            }
            
            const startTimeString = teeTime.start_datetime.replace(".000Z", "")
            const startDatetime = new Date(startTimeString)
            const startTime = startDatetime.toTimeString().slice(0, 5) // HH:MM format
            
            const teeTimeObj: TeeTime = {
                start_date: typedCourseTeeTimes.date,
                start_time: startTime,
                start_datetime: startTimeString,
                players_available: typeof teeTime.players_available === 'string' ? parseInt(teeTime.players_available) : teeTime.players_available,
                course_name: typedCourseTeeTimes.courses.display_name,
                rating: typedCourseTeeTimes.courses.rating,
                holes: teeTime.holes,
                price: teeTime.price,
                city: typedCourseTeeTimes.courses.cities.name,
                booking_link: teeTime.booking_link,
                temperature: getForecastNumber(forecast, 'temperature_2m', startTime),
                precipitation_probability: getForecastNumber(forecast, 'precipitation_probability', startTime),
                weather_code: getWeatherDescription(getForecastNumber(forecast, 'weather_code', startTime)),
                wind_speed: getForecastNumber(forecast, 'wind_speed_10m', startTime),
                wind_gusts: getForecastNumber(forecast, 'wind_gusts_10m', startTime),
                cloud_cover: getForecastNumber(forecast, 'cloud_cover', startTime),
                uv_index: getForecastNumber(forecast, 'uv_index', startTime),
                precipitation: getForecastNumber(forecast, 'precipitation', startTime)
            }
            
            result.push(teeTimeObj)
        })
    })
    
    // Sort result by start_datetime ascending
    result.sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
    
    return { data: result, error: null }
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

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export interface CourseInfo {
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
    start_date: string;
    start_time: string;
    start_datetime: string;
    players_available: number;
    course_id: number;
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
    course: CourseInfo;
}

interface TeeTimeFilters {
    dates: string[];  // Format: YYYY-MM-DD
    numOfPlayers: string;
    holes: string;
    regionId: string;
    // Optional: restrict to these course IDs if provided
    courseIds?: string[];
    startTime: number;
    endTime: number;
}

// Cities are now fetched dynamically from the database via supabaseService

export const fetchTeeTimes = async (filters: TeeTimeFilters): Promise<TeeTime[]> => {
    try {
        // Construct URL with query parameters
        const params = new URLSearchParams();
        params.append('dates', filters.dates.join(','));
        params.append('numOfPlayers', filters.numOfPlayers);
        params.append('holes', filters.holes);
        params.append('region_id', filters.regionId);
        params.append('startTime', filters.startTime.toString());
        params.append('endTime', filters.endTime.toString());
        if (filters.courseIds && filters.courseIds.length > 0) {
            params.append('courseIds', filters.courseIds.join(','));
        }

        const response = await fetch(`${supabaseUrl}/functions/v1/tee-times?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json',
            }
        })
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: TeeTime[] = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching tee times:', error);
        throw error;
    }
};
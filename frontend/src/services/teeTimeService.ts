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

interface TeeTimeFilters {
    dates: string[];  // Format: YYYY-MM-DD
    numOfPlayers: number;
    holes: number;
}

// Cities are now fetched dynamically from the database via supabaseService

export const fetchTeeTimes = async (filters: TeeTimeFilters): Promise<TeeTime[]> => {
    try {
        // Construct URL with query parameters
        const params = new URLSearchParams();
        params.append('dates', filters.dates.join(','));
        params.append('numOfPlayers', filters.numOfPlayers.toString());
        params.append('holes', filters.holes.toString());
        
        const response = await fetch(`/api/tee-times?${params.toString()}`);
        
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
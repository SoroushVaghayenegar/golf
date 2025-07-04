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
        const url = new URL('https://vndbaupvj666ku3bhellxf5akq0vzkje.lambda-url.us-west-2.on.aws/');
        url.searchParams.append('dates', filters.dates.join(','));
        url.searchParams.append('numOfPlayers', filters.numOfPlayers.toString());
        url.searchParams.append('holes', filters.holes.toString());
        
        const response = await fetch(url.toString());
        
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
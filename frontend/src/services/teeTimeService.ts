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
    slug: string;
}

export interface TeeTime {
    id: string;
    start_date: string;
    start_time: string;
    start_datetime: string;
    players_available: number;
    available_participants: number[];
    course_id: number;
    course_name: string;
    holes: number;
    starting_tee: number;
    price: number;
    city: string;
    booking_link: string | null;
    booking_links: { [key: number]: string } | null;
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

export interface TeeTimeFilters {
    dates: string[];  // Format: YYYY-MM-DD
    numOfPlayers: string;
    holes: string;
    regionId: string;
    // Optional: restrict to these course IDs if provided
    courseIds?: string[];
    startTime: number;
    endTime: number;
}

export interface FetchProgress {
    completed: number;
    total: number;
    currentCourses?: string[];
}

export interface SSEMessage {
    type: "progress" | "complete" | "error";
    progress?: FetchProgress;
    teeTimes?: TeeTime[];
    error?: string;
}

export interface FetchTeeTimesCallbacks {
    onProgress?: (progress: FetchProgress) => void;
    onComplete?: (teeTimes: TeeTime[]) => void;
    onError?: (error: string) => void;
    onAbort?: () => void;
}

export interface FetchTeeTimesResult {
    promise: Promise<TeeTime[]>;
    abort: () => void;
}

export const fetchTeeTimes = (
    filters: TeeTimeFilters,
    callbacks?: FetchTeeTimesCallbacks
): FetchTeeTimesResult => {
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

    const url = `/api/tee-times?${params.toString()}`;

    // Use EventSource for SSE
    const eventSource = new EventSource(url);
    let teeTimes: TeeTime[] = [];
    let isAborted = false;

    const abort = () => {
        isAborted = true;
        eventSource.close();
        callbacks?.onAbort?.();
    };

    const promise = new Promise<TeeTime[]>((resolve, reject) => {
        eventSource.onmessage = (event) => {
            if (isAborted) return;
            
            try {
                const message: SSEMessage = JSON.parse(event.data);

                if (message.type === "progress" && message.progress) {
                    callbacks?.onProgress?.(message.progress);
                } else if (message.type === "complete") {
                    teeTimes = message.teeTimes || [];
                    callbacks?.onComplete?.(teeTimes);
                    eventSource.close();
                    resolve(teeTimes);
                } else if (message.type === "error") {
                    const errorMsg = message.error || "Unknown error";
                    callbacks?.onError?.(errorMsg);
                    eventSource.close();
                    reject(new Error(errorMsg));
                }
            } catch (parseError) {
                console.error('Error parsing SSE message:', parseError);
            }
        };

        eventSource.onerror = (error) => {
            if (isAborted) {
                // Aborted by user - resolve with whatever we have so far
                resolve(teeTimes);
                return;
            }
            
            console.error('SSE connection error:', error);
            eventSource.close();
            
            // Try to determine if it's a real error or just the stream ending
            if (teeTimes.length > 0) {
                // Stream may have ended naturally after sending complete
                resolve(teeTimes);
            } else {
                const errorMsg = 'Failed to fetch tee times';
                callbacks?.onError?.(errorMsg);
                reject(new Error(errorMsg));
            }
        };
    });

    return { promise, abort };
};

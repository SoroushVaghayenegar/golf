import { createClient } from "@/lib/supabase/client"
export interface Course {
    id: number;
    name: string;
}

export interface TeeTimeWatchlistFilters {
    date: string;
    start_hour: number;
    end_hour: number;
    num_of_players: string;
    holes: string;
    regionId: string;
    courses: Course[];
    weather_preferences?: {
        enabled: boolean;
        temperature_preference: string;
        rain_preference: string;
        wind_speed: string;
        forecast_days: string;
    };
}

interface TeeTimeWatchlistRow {
    id: number;
    date: string;
    start_hour: number;
    end_hour: number;
    num_of_players: string;
    holes: string;
    region_id: string;
    courses: Course[];
    notification_sent?: boolean;
    created_at?: string;
    regions?: { name: string } | null;
    processed_tee_times?: string[];
    processed_tee_times_count?: number;
    weather_preferences?: {
        enabled: boolean;
        temperature_preference: string;
        rain_preference: string;
        wind_speed: string;
        forecast_days: string;
    };
}

export type TeeTimeWatchlist = Omit<TeeTimeWatchlistRow, "regions"> & {
    region: string | null;
}

export const createTeeTimeWatchlist = async (filters: TeeTimeWatchlistFilters) => {
    const client = createClient()
    const insertData: Record<string, unknown> = {
        date: filters.date,
        start_hour: filters.start_hour,
        end_hour: filters.end_hour,
        num_of_players: filters.num_of_players,
        holes: filters.holes,
        region_id: filters.regionId,
        courses: filters.courses,
    };

    // Add weather preferences if provided
    if (filters.weather_preferences) {
        insertData.weather_preferences = filters.weather_preferences;
    }

    const { data, error } = await client
        .from('tee_time_watchlists')
        .insert(insertData)
        .select('*, regions(name)')
        .single()

    if (error) {
        throw error
    }

    // Flatten region name for convenience in UI
    const typed: TeeTimeWatchlistRow | null = data as unknown as TeeTimeWatchlistRow | null
    return typed ? { ...typed, region: typed.regions?.name ?? null } as TeeTimeWatchlist : null
}

export const getTeeTimeWatchlists = async () => {
    const client = createClient()
    const { data, error } = await client
        .from('tee_time_watchlists')
        .select('*, regions(name), processed_tee_times')
        .gte('date', new Date().toISOString())

    if (error) {
        throw error
    }

    // Map nested region to flat string to match UI expectations and calculate count
    const rows: TeeTimeWatchlistRow[] = (data ?? []) as unknown as TeeTimeWatchlistRow[]
    return rows.map((row) => ({
        ...row,
        region: row.regions?.name ?? null,
        processed_tee_times_count: Array.isArray(row.processed_tee_times) ? row.processed_tee_times.length : 0,
    })) as TeeTimeWatchlist[]
}

export const deleteTeeTimeWatchlist = async (id: number) => {
    const client = createClient()
    const { error } = await client
        .from('tee_time_watchlists')
        .delete()
        .eq('id', id)

    if (error) {
        throw error
    }
}
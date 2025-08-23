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
}

export type TeeTimeWatchlist = Omit<TeeTimeWatchlistRow, "regions"> & {
    region: string | null;
}

export const createTeeTimeWatchlist = async (filters: TeeTimeWatchlistFilters) => {
    const client = createClient()
    const { data, error } = await client
        .from('tee_time_watchlists')
        .insert({
            date: filters.date,
            start_hour: filters.start_hour,
            end_hour: filters.end_hour,
            num_of_players: filters.num_of_players,
            holes: filters.holes,
            region_id: filters.regionId,
            courses: filters.courses,
        })
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
        .select('*, regions(name)')
        .eq('notification_sent', false)
        .gte('date', new Date().toISOString())

    if (error) {
        throw error
    }

    // Map nested region to flat string to match UI expectations
    const rows: TeeTimeWatchlistRow[] = (data ?? []) as unknown as TeeTimeWatchlistRow[]
    return rows.map((row) => ({
        ...row,
        region: row.regions?.name ?? null,
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
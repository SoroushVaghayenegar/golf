import { createClient } from "@/lib/supabase/client"
export interface Course {
    id: number;
    name: string;
}

export interface TeeTimeWatchlistFilters {
    date: string;
    start_time: string;
    end_time: string;
    num_of_players: string;
    holes: string;
    regionId: string;
    courses: Course[];
}

export const createTeeTimeWatchlist = async (filters: TeeTimeWatchlistFilters) => {
    const client = createClient()
    const { data, error } = await client
        .from('tee_time_watchlists')
        .insert({
            date: filters.date,
            start_time: filters.start_time,
            end_time: filters.end_time,
            num_of_players: filters.num_of_players,
            holes: filters.holes,
            region_id: filters.regionId,
            courses: filters.courses,
        })
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export const getTeeTimeWatchlists = async () => {
    const client = createClient()
    const { data, error } = await client
        .from('tee_time_watchlists')
        .select('*')
        .eq('notification_sent', false)
        .gte('date', new Date().toISOString())

    if (error) {
        throw error
    }

    return data
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
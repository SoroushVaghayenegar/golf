// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export interface Subscription {
    email: string;
    day_list: string[];
    start_time: string;
    end_time: string;
    city_list: string[];
    course_list: string[];
    broadcast_day_list: string[];
}

export const createSubscription = async (subscription: Subscription) => {
    try {
        const response = await fetch(`${supabaseUrl}/functions/v1/create-tee-time-subscription`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(subscription),
        })
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        return data
    } catch (error) {
        console.error('Error creating subscription:', error)
        throw error
    }
}

export const unsubscribe = async (email: string, token: string) => {
    try {
        const response = await fetch(`${supabaseUrl}/functions/v1/unsubscribe`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, token }),
        })
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        return data
    } catch (error) {
        console.error('Error unsubscribing:', error)
        throw error
    }
}


export const fetchCourseDisplayNamesAndTheirCities = async (region: string) => {
    try {
        const response = await fetch(`/api/courses?region=${region}`)
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        return data
    } catch (error) {
        console.error('Error fetching course display names:', error)
        throw error
    }
}
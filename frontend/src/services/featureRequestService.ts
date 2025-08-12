import { createClient } from "@/lib/supabase/client"

export interface FeatureRequest {
    type: string;
    request: string;
    email: string;
}

export const sendFeatureRequest = async (featureRequest: FeatureRequest) => {
    const { data, error } = await createClient()
        .from('feature_requests')
        .insert({ 
            type: featureRequest.type, 
            request: featureRequest.request,
            email: featureRequest.email 
        })

    if (error) {
        console.error('Error inserting record:', error)
    } else {
        console.log('Record inserted:', data)
    }
}
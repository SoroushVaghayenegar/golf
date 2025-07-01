import { supabaseClient } from "./supabaseClient"

export interface FeatureRequest {
    type: string;
    request: string;
}

export const sendFeatureRequest = async (featureRequest: FeatureRequest) => {
    const { data, error } = await supabaseClient
        .from('feature_requests')
        .insert({ type: featureRequest.type, request: featureRequest.request })

    if (error) {
        console.error('Error inserting record:', error)
    } else {
        console.log('Record inserted:', data)
    }
}
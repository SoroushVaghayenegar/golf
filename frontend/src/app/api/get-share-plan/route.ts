import { NextRequest, NextResponse } from "next/server" 
import { createClient } from "@/lib/supabase/server"

export interface ShareTeeTime {
  id: number;
  created_at: string;
  share_id: number;
  approvals: string[];
  disapprovals: string[];
  tee_time_object: Record<string, unknown>;
  available: boolean;
}

export interface GetShareResponse {
  share_id: number;
  token: string;
  tee_times: ShareTeeTime[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const token = searchParams.get("token")
    if (!token) {
      return NextResponse.json(
        { error: "token parameter is required" }, 
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = await createClient()

    // First, find the share with the given token
    const { data: shareData, error: shareError } = await supabase
      .from('shares')
      .select('id, token, region_id')
      .eq('token', token)
      .single()

    if (shareError || !shareData) {
      console.error('Error finding share:', shareError)
      return NextResponse.json(
        { error: "Share not found" },
        { status: 404 }
      )
    }

    // Then, get all share_tee_times for this share
    const { data: teeTimesData, error: teeTimesError } = await supabase
      .from('share_tee_times')
      .select('*')
      .eq('share_id', shareData.id)
      .order('created_at', { ascending: true })

    if (teeTimesError) {
      console.error('Error fetching tee times:', teeTimesError)
      return NextResponse.json(
        { error: "Failed to fetch tee times" },
        { status: 500 }
      )
    }

    // Extract unique dates from tee times and check current availability
    let updatedTeeTimesData = teeTimesData || []

    if (teeTimesData && teeTimesData.length > 0) {
      try {
        // Extract unique dates from tee_time_object.start_date
        const uniqueDates = [...new Set(
          teeTimesData
            .map(teeTime => teeTime.tee_time_object?.start_date)
            .filter(date => date) // Filter out null/undefined dates
        )]

        if (uniqueDates.length > 0) {
          // Make API call to check current availability
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          
          const params = new URLSearchParams()
          params.append('dates', uniqueDates.join(','))
          params.append('region_id', shareData.region_id.toString())

          const response = await fetch(`${supabaseUrl}/functions/v1/tee-times?${params.toString()}`, {
            headers: {
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'Content-Type': 'application/json',
            }
          })

          if (response.ok) {
            const currentTeeTimesData = await response.json()
            
            // Update each share tee time with availability info
            updatedTeeTimesData = teeTimesData.map(shareTeeTime => {
              // Find matching current tee time by comparing key properties
              const matchingCurrentTeeTime = currentTeeTimesData.find((currentTeeTime: Record<string, unknown>) => 
                currentTeeTime.id === shareTeeTime.tee_time_object?.id ||
                (
                  currentTeeTime.start_datetime === shareTeeTime.tee_time_object?.start_datetime &&
                  currentTeeTime.course_id === shareTeeTime.tee_time_object?.course_id
                )
              )

              if (matchingCurrentTeeTime) {
                // Use current tee time data and mark as available
                return {
                  ...shareTeeTime,
                  tee_time_object: matchingCurrentTeeTime,
                  available: true
                }
              } else {
                // Use original share tee time data but mark as unavailable
                return {
                  ...shareTeeTime,
                  available: false
                }
              }
            })
          } else {
            console.warn('Failed to fetch current tee time availability, using original data')
            // If API call fails, mark all as available (fallback behavior)
            updatedTeeTimesData = teeTimesData.map(teeTime => ({
              ...teeTime,
              available: true
            }))
          }
        } else {
          // No valid dates found, use original data
          updatedTeeTimesData = teeTimesData.map(teeTime => ({
            ...teeTime,
            available: true
          }))
        }
      } catch (error) {
        console.error('Error checking tee time availability:', error)
        // If there's an error, use original data and mark as available (fallback)
        updatedTeeTimesData = teeTimesData.map(teeTime => ({
          ...teeTime,
          available: true
        }))
      }
    }

    // Sort tee times to prioritize those with votes (approvals or disapprovals)
    const sortedTeeTimesData = updatedTeeTimesData.sort((a, b) => {
      // Check if tee time has any votes (non-empty approvals or disapprovals)
      const aHasVotes = (Array.isArray(a.approvals) && a.approvals.length > 0) || 
                        (Array.isArray(a.disapprovals) && a.disapprovals.length > 0)
      const bHasVotes = (Array.isArray(b.approvals) && b.approvals.length > 0) || 
                        (Array.isArray(b.disapprovals) && b.disapprovals.length > 0)
      
      // If both have votes or both don't have votes, maintain original order (by created_at)
      if (aHasVotes === bHasVotes) {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      
      // Prioritize tee times with votes (return -1 if a has votes and b doesn't)
      return aHasVotes ? -1 : 1
    })

    // Return the share data with sorted tee times
    const response: GetShareResponse = {
      share_id: shareData.id,
      token: shareData.token,
      tee_times: sortedTeeTimesData
    }

    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Error in GET /api/get-share-plan:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

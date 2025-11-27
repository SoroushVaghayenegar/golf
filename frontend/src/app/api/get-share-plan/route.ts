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

        // Extract unique course IDs to filter the request
        const uniqueCourseIds = [...new Set(
          teeTimesData
            .map(teeTime => teeTime.tee_time_object?.course_id)
            .filter(id => id != null)
        )]

        // Extract unique holes values (9 or 18)
        const uniqueHoles = [...new Set(
          teeTimesData
            .map(teeTime => teeTime.tee_time_object?.holes)
            .filter(holes => holes === 9 || holes === 18)
        )] as number[]

        // Default to 18 if no valid holes found
        const holesValues = uniqueHoles.length > 0 ? uniqueHoles : [18]

        if (uniqueDates.length > 0) {
          // Use the same /api/tee-times route as the search page
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
          
          // Helper function to fetch tee times from SSE stream
          const fetchTeeTimesFromSSE = async (holes: number): Promise<Record<string, unknown>[]> => {
            const params = new URLSearchParams()
            params.append('dates', uniqueDates.join(','))
            params.append('region_id', shareData.region_id.toString())
            params.append('numOfPlayers', '4') // Use max players to get all available tee times
            params.append('holes', holes.toString())
            params.append('startTime', '5') // Wide time range
            params.append('endTime', '22')
            if (uniqueCourseIds.length > 0) {
              params.append('courseIds', uniqueCourseIds.join(','))
            }

            const response = await fetch(`${baseUrl}/api/tee-times?${params.toString()}`, {
              headers: {
                'Accept': 'text/event-stream',
              }
            })

            if (!response.ok || !response.body) {
              return []
            }

            // Parse the SSE stream to get the final tee times
            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let teeTimes: Record<string, unknown>[] = []

            try {
              while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                const lines = chunk.split('\n')

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    try {
                      const data = JSON.parse(line.slice(6))
                      if (data.type === 'complete' && data.teeTimes) {
                        teeTimes = data.teeTimes
                      }
                    } catch {
                      // Skip malformed JSON lines
                    }
                  }
                }
              }
            } finally {
              reader.releaseLock()
            }

            return teeTimes
          }

          // Fetch tee times for each unique holes value and combine results
          const allCurrentTeeTimesPromises = holesValues.map(holes => fetchTeeTimesFromSSE(holes))
          const allCurrentTeeTimesResults = await Promise.all(allCurrentTeeTimesPromises)
          const currentTeeTimesData = allCurrentTeeTimesResults.flat()
            
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

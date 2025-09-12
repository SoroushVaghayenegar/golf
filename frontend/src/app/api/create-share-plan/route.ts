import { NextRequest, NextResponse } from "next/server" 
import { createClient } from "@/lib/supabase/server"
import { type TeeTime } from "@/services/teeTimeService"

export interface CreateShareRequest {
  teeTimes: TeeTime[];
  regionId: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate that body has the expected structure
    if (!body || typeof body !== 'object' || !('teeTimes' in body) || !('regionId' in body)) {
      return NextResponse.json(
        { error: "Request body must contain 'teeTimes' array and 'regionId' number" },
        { status: 400 }
      )
    }

    const { teeTimes, regionId } = body;
    
    // Validate that teeTimes is an array
    if (!Array.isArray(teeTimes)) {
      return NextResponse.json(
        { error: "teeTimes must be an array of TeeTime objects" },
        { status: 400 }
      )
    }

    // Validate regionId
    if (!regionId || typeof regionId !== 'number') {
      return NextResponse.json(
        { error: "regionId must be a valid number" },
        { status: 400 }
      )
    }
    
    // Validate max 5 TeeTime objects
    if (teeTimes.length === 0) {
      return NextResponse.json(
        { error: "At least 1 TeeTime object is required" },
        { status: 400 }
      )
    }
    
    if (teeTimes.length > 5) {
      return NextResponse.json(
        { error: "Maximum 5 TeeTime objects allowed" },
        { status: 400 }
      )
    }
    
    // Basic validation that each item has required TeeTime fields
    const requiredFields = ['id', 'start_date', 'start_time', 'course_id', 'course_name']
    for (let i = 0; i < teeTimes.length; i++) {
      const teeTime = teeTimes[i]
      for (const field of requiredFields) {
        if (!(field in teeTime)) {
          return NextResponse.json(
            { error: `TeeTime object at index ${i} is missing required field: ${field}` },
            { status: 400 }
          )
        }
      }
    }
    
    // Create Supabase client
    const supabase = await createClient()
    
    // Insert a new row in the shares table
    const { data: shareData, error: shareError } = await supabase
      .from('shares')
      .insert({ region_id: regionId })  // Include region_id
      .select()
      .single()
    
    if (shareError) {
      console.error('Error creating share:', shareError)
      return NextResponse.json(
        { error: "Failed to create share" },
        { status: 500 }
      )
    }
    
    const token = shareData.token
    const shareId = shareData.id

    // Prepare tee time objects for batch insertion
    const teeTimeRows = teeTimes.map((teeTime: TeeTime) => ({
      share_id: shareId,
      tee_time_object: teeTime
    }))

    // Batch insert all tee times into share_tee_times table
    const { error: teeTimesError } = await supabase
      .from('share_tee_times')
      .insert(teeTimeRows)

    if (teeTimesError) {
      console.error('Error inserting tee times:', teeTimesError)
      return NextResponse.json(
        { error: "Failed to save tee times to share" },
        { status: 500 }
      )
    }
    
    // Return only the token
    return NextResponse.json({
      token: token
    })
    
  } catch (error) {
    console.error('Error in POST /api/create-share:', error)
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    )
  }
}


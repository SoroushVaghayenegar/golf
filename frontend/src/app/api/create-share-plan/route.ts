import { NextRequest, NextResponse } from "next/server" 
import { createClient } from "@/lib/supabase/server"
import { type TeeTime } from "@/services/teeTimeService"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate that body is an array
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: "Request body must be an array of TeeTime objects" },
        { status: 400 }
      )
    }
    
    // Validate max 5 TeeTime objects
    if (body.length === 0) {
      return NextResponse.json(
        { error: "At least 1 TeeTime object is required" },
        { status: 400 }
      )
    }
    
    if (body.length > 5) {
      return NextResponse.json(
        { error: "Maximum 5 TeeTime objects allowed" },
        { status: 400 }
      )
    }
    
    // Basic validation that each item has required TeeTime fields
    const requiredFields = ['id', 'start_date', 'start_time', 'course_id', 'course_name']
    for (let i = 0; i < body.length; i++) {
      const teeTime = body[i]
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
      .insert({})  // Empty object since token is auto-generated
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
    const teeTimeRows = body.map((teeTime: TeeTime) => ({
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


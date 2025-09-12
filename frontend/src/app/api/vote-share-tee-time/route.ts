import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export interface VoteShareTeeTimeRequest {
  share_tee_time_id: number;
  client_id: string;
  approval: boolean;
}

export interface VoteShareTeeTimeResponse {
  success: boolean;
  message: string;
  updated_approvals: string[];
  updated_disapprovals: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json() as VoteShareTeeTimeRequest;
    
    // Validate required fields
    if (!body.share_tee_time_id || typeof body.share_tee_time_id !== 'number') {
      return NextResponse.json(
        { error: "share_tee_time_id is required and must be a number" },
        { status: 400 }
      )
    }
    
    if (!body.client_id || typeof body.client_id !== 'string') {
      return NextResponse.json(
        { error: "client_id is required and must be a string" },
        { status: 400 }
      )
    }
    
    if (typeof body.approval !== 'boolean') {
      return NextResponse.json(
        { error: "approval is required and must be a boolean" },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = await createClient()

    // First, fetch the current ShareTeeTime record
    const { data: shareTeeTime, error: fetchError } = await supabase
      .from('share_tee_times')
      .select('*')
      .eq('id', body.share_tee_time_id)
      .single()
    
    if (fetchError || !shareTeeTime) {
      console.error('Error fetching share tee time:', fetchError)
      return NextResponse.json(
        { error: "Share tee time not found" },
        { status: 404 }
      )
    }

    // Get current approvals and disapprovals arrays
    let currentApprovals: string[] = Array.isArray(shareTeeTime.approvals) ? shareTeeTime.approvals : []
    let currentDisapprovals: string[] = Array.isArray(shareTeeTime.disapprovals) ? shareTeeTime.disapprovals : []

    // Check current state of client_id
    const isInApprovals = currentApprovals.includes(body.client_id)
    const isInDisapprovals = currentDisapprovals.includes(body.client_id)

    // Implement toggle behavior
    if (body.approval) {
      // User wants to approve
      if (isInApprovals) {
        // Already approved, remove from approvals (toggle off)
        currentApprovals = currentApprovals.filter(id => id !== body.client_id)
      } else {
        // Not approved yet, add to approvals and remove from disapprovals
        currentApprovals = [...currentApprovals.filter(id => id !== body.client_id), body.client_id]
        currentDisapprovals = currentDisapprovals.filter(id => id !== body.client_id)
      }
    } else {
      // User wants to disapprove
      if (isInDisapprovals) {
        // Already disapproved, remove from disapprovals (toggle off)
        currentDisapprovals = currentDisapprovals.filter(id => id !== body.client_id)
      } else {
        // Not disapproved yet, add to disapprovals and remove from approvals
        currentDisapprovals = [...currentDisapprovals.filter(id => id !== body.client_id), body.client_id]
        currentApprovals = currentApprovals.filter(id => id !== body.client_id)
      }
    }

    // Update the record in the database
    const { data: updatedData, error: updateError } = await supabase
      .from('share_tee_times')
      .update({
        approvals: currentApprovals,
        disapprovals: currentDisapprovals
      })
      .eq('id', body.share_tee_time_id)
      .select('approvals, disapprovals')
      .single()

    console.log('Updated share tee time:', updatedData)

    if (updateError) {
      console.error('Error updating share tee time:', updateError)
      return NextResponse.json(
        { error: "Failed to update vote" },
        { status: 500 }
      )
    }

    // Determine what action was taken for the response message
    let message: string
    const finalApprovals = updatedData.approvals || []
    const finalDisapprovals = updatedData.disapprovals || []
    
    const isNowInApprovals = finalApprovals.includes(body.client_id)
    const isNowInDisapprovals = finalDisapprovals.includes(body.client_id)
    
    if (isNowInApprovals) {
      message = "Vote recorded as approval"
    } else if (isNowInDisapprovals) {
      message = "Vote recorded as disapproval"  
    } else {
      message = body.approval ? "Approval vote removed" : "Disapproval vote removed"
    }

    // Return success response
    const response: VoteShareTeeTimeResponse = {
      success: true,
      message: message,
      updated_approvals: finalApprovals,
      updated_disapprovals: finalDisapprovals
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in POST /api/vote-share-tee-time:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

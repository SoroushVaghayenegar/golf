import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Check if the current user has already requested membership
export async function GET() {
    try {
        const supabase = await createClient()
        
        // Get the current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check if the user already has a membership request
        const { data, error } = await supabase
            .from('membership_request')
            .select('user_id')
            .eq('user_id', user.id)
            .maybeSingle()

        if (error) {
            console.error('Error checking membership request:', error)
            return NextResponse.json({ error: "Failed to check membership status" }, { status: 500 })
        }

        return NextResponse.json({ hasRequested: !!data })
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST - Create a new membership request for the current user
export async function POST() {
    try {
        const supabase = await createClient()
        
        // Get the current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check if user already has a request (prevent duplicates)
        const { data: existing } = await supabase
            .from('membership_request')
            .select('user_id')
            .eq('user_id', user.id)
            .maybeSingle()

        if (existing) {
            return NextResponse.json({ error: "You have already requested membership" }, { status: 409 })
        }

        // Insert the membership request
        const { error } = await supabase
            .from('membership_request')
            .insert({ user_id: user.id })

        if (error) {
            console.error('Error creating membership request:', error)
            return NextResponse.json({ error: "Failed to create membership request" }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}


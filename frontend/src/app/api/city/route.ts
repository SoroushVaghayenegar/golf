import { NextRequest, NextResponse } from "next/server" 
import { createClient } from "@/lib/supabase/server"


export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        
        // Parse query parameters
        const citySlugParam = searchParams.get("slug")
        if (!citySlugParam) {
            return NextResponse.json({ error: "slug parameter is required" }, { status: 400 })
        }
        
        const { data: cityData, error } = await (await createClient())
        .from('cities')
        .select('*')
        .ilike('slug', citySlugParam);

        if (error) {
            throw new Error(`Error fetching city: ${error.message}`)
        }

        

        return NextResponse.json(cityData)
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
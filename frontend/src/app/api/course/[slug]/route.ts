import { NextRequest, NextResponse } from "next/server" 
import { createClient } from "@/lib/supabase/server"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params
        
        if (!slug) {
            return NextResponse.json({ error: "slug parameter is required" }, { status: 400 })
        }
        
        const { data: courseData, error } = await (await createClient())
            .from('courses_view')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: "Course not found" }, { status: 404 })
            }
            throw new Error(`Error fetching course: ${error.message}`)
        }

        if (!courseData) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 })
        }

        // Return the requested course information
        const result = {
            id: courseData.id,
            name: courseData.name,
            address: courseData.address,
            latitude: courseData.latitude,
            longitude: courseData.longitude,
            phone_number: courseData.phone_number,
            city_name: courseData.city_name,
            city_slug: courseData.city_slug,
            region_name: courseData.region_name,
            region_id: courseData.region_id,
            region_slug: courseData.region_slug,
            timezone: courseData.timezone,
            rating: courseData.rating,
            image_url: courseData.image_url,
            description: courseData.description,
        };

        return NextResponse.json(result)
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

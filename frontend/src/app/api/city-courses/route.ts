import { NextRequest, NextResponse } from "next/server" 
import { createClient } from "@/lib/supabase/server"


export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        
        // Parse query parameters
        const citySlugParam = searchParams.get("city_slug")
        if (!citySlugParam) {
            return NextResponse.json({ error: "city_slug parameter is required" }, { status: 400 })
        }
        
        const { data: coursesData, error } = await (await createClient())
        .from('courses_view')
        .select('*')
        .ilike('city_slug', citySlugParam);

        if (error) {
            throw new Error(`Error fetching courses: ${error.message}`)
        }

        // Sort courses by name
        const sortedCourses = coursesData.sort((a, b) => a.name.localeCompare(b.name));
        const cityName = coursesData[0].city_name
        
        // Transform courses into array format
        const courses = sortedCourses.map(({ id, name, description, image_url, address, rating, slug }: { id: number, name: string, description: string, image_url: string, address: string, rating: number, slug: string }) => ({
            id: id, 
            name: name,
            description: description,
            image_url: image_url,
            address: address,
            rating: rating,
            slug: slug
        }));    

        // Return the requested structure
        const result = {
            city: {
                name: cityName
            },
            courses: courses
        };

        return NextResponse.json(result)
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
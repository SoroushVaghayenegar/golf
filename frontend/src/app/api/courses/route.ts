import { NextRequest, NextResponse } from "next/server" 
import { createClient } from "@/lib/supabase/server"


export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        
        // Parse query parameters
        const regionIdParam = searchParams.get("region_id")
        if (!regionIdParam) {
            return NextResponse.json({ error: "region_id parameter is required" }, { status: 400 })
        }
        
        const { data: coursesData, error } = await (await createClient())
        .from('courses_view')
        .select('*')
        .eq('region_id', regionIdParam);

        if (error) {
            throw new Error(`Error fetching courses: ${error.message}`)
        }

        // Sort courses by display_name and merge results into a hashmap
        const sortedCourses = coursesData.sort((a, b) => a.display_name.localeCompare(b.display_name));
        const result: Record<string, { courseId: number; city: string; region: string; latitude: number; longitude: number; holes: number[] }> = {};
        sortedCourses.forEach(({ id, display_name, city_name, region_name, latitude, longitude, external_api_attributes }: { id: number, display_name: string, city_name: string, region_name: string, latitude: number, longitude: number, external_api_attributes?: { course_holes?: number[] } })=>{
            // Get holes array from external_api_attributes.course_holes
            const holes = external_api_attributes?.course_holes ?? [];
            result[display_name] = {
                courseId: id, 
                city: city_name,
                region: region_name,
                latitude: latitude,
                longitude: longitude,
                holes: holes
            };
        });


        return NextResponse.json(result)
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
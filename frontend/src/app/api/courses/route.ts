import { NextRequest, NextResponse } from "next/server" 
import { createClient } from "@/lib/supabase/server"


export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        
        // Parse query parameters
        const regionParam = searchParams.get("region")
        if (!regionParam) {
            return NextResponse.json({ error: "region parameter is required" }, { status: 400 })
        }
        
        const { data: coursesData, error } = await (await createClient())
        .from('courses_view')
        .select('*')
        .eq('region_name', regionParam);

        if (error) {
            throw new Error(`Error fetching courses: ${error.message}`)
        }

        // Sort courses by display_name and merge results into a hashmap
        const sortedCourses = coursesData.sort((a, b) => a.display_name.localeCompare(b.display_name));
        const result: Record<string, { courseId: number; city: string; region: string }> = {};
        sortedCourses.forEach(({ id, display_name, city_name, region_name }: { id: number, display_name: string, city_name: string, region_name: string })=>{
            result[display_name] = {
                courseId: id, 
                city: city_name,
                region: region_name
            };
        });


        return NextResponse.json(result)
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
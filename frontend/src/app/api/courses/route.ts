import { NextRequest, NextResponse } from "next/server" 
import { supabaseClient } from "@/services/supabaseClient"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
    try {
        const { data: coursesData, error } = await supabaseClient
        .from('courses')
        .select(`
            *,
            cities!inner(name)
        `)
        
        if (error) {
            throw new Error(`Error fetching courses: ${error.message}`)
        }

        // Sort courses by display_name and merge results into a hashmap
        const sortedCourses = coursesData.sort((a, b) => a.display_name.localeCompare(b.display_name));
        const result: Record<string, { courseId: number; city: string }> = {};
        sortedCourses.forEach(({ id, display_name, cities }: { id: number, display_name: string, cities: { name: string } })=>{
            result[display_name] = {courseId: id, city: cities.name};
        });


        return NextResponse.json(result)
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
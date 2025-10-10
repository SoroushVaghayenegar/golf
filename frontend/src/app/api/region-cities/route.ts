import { NextRequest, NextResponse } from "next/server" 
import { createClient } from "@/lib/supabase/server"


export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        
        // Parse query parameters
        const regionSlugParam = searchParams.get("region_slug")
        if (!regionSlugParam) {
            return NextResponse.json({ error: "region_slug parameter is required" }, { status: 400 })
        }
        
        const { data: citiesData, error } = await (await createClient())
        .from('cities')
        .select('*, regions!inner(slug, name, image_url)')
        .ilike('regions.slug', regionSlugParam);

        if (error) {
            throw new Error(`Error fetching cities: ${error.message}`)
        }

        // Sort cities by name
        const sortedCities = citiesData.sort((a, b) => a.name.localeCompare(b.name));
        const regionName = citiesData[0].regions.name
        const regionImageUrl = citiesData[0].regions.image_url
        
        // Transform courses into array format
        const cities = sortedCities.map(({ id, name, image_url, slug, latitude, longitude }: { id: number, name: string, image_url: string, slug: string, latitude: number, longitude: number }) => ({
            id: id, 
            name: name,
            image_url: image_url,
            slug: slug,
            latitude: latitude,
            longitude: longitude
        }));

        const result = {
            region: {
                name: regionName,
                image_url: regionImageUrl
            },
            cities: cities
        };

        return NextResponse.json(result)
    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
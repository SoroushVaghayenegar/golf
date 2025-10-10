export interface FAQItem {
    question: string;
    answer: string;
}

export interface City {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    image_url: string;
    slug: string;
    faqs: FAQItem[];
    regions?: {
        slug: string;
        name: string;
        image_url: string;
    };
}

export interface RegionCities {
    region: {
        name: string;
        image_url: string;
    };
    cities: City[];
}

/**
 * Fetches city data from the API using a city slug
 * @param citySlug - The slug of the city to fetch
 * @returns Promise<City> - Single city object matching the slug
 */
export async function fetchCityBySlug(slug: string): Promise<City> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
        const response = await fetch(`${baseUrl}/api/city?slug=${slug}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch city: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        // Return the first city from the array (should be only one city)
        if (Array.isArray(data) && data.length > 0) {
            return data[0];
        }
        throw new Error('City not found');
    } catch (error) {
        console.error('Error fetching city:', error);
        throw error;
    }
}


/**
 * Fetches cities from the API using a region slug
 * @param regionSlug - The slug of the region to fetch
 * @returns Promise<City[]> - Array of cities matching the region slug
 */
export async function fetchRegionCities(regionSlug: string): Promise<RegionCities> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
        const response = await fetch(`${baseUrl}/api/region-cities?region_slug=${regionSlug}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch region cities: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data as RegionCities;
    } catch (error) {
        console.error('Error fetching region cities:', error);
        throw error;
    }
}
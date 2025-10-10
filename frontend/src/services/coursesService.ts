export interface Course {
    id: number;
    name: string;
    description: string;
    image_url: string;
    address: string;
    rating: number;
    slug: string;
}
  
export interface CityCoursesData {
    city: {
      name: string;
    };
    courses: Course[];
}

export interface CourseDetail {
    id: number;
    name: string;
    description: string;
    address: string;
    latitude: number;
    longitude: number;
    phone_number: string;
    city_name: string;
    city_slug: string;
    region_name: string;
    region_id: number;
    region_slug: string;
    timezone: string;
    rating: number;
    image_url: string;
}

export const fetchCityCourses = async (citySlug: string): Promise<CityCoursesData> => {
    try {
        if (!citySlug) {
            return {
                city: {
                    name: ''
                },
                courses: []
            };
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
        const response = await fetch(`${baseUrl}/api/city-courses?city_slug=${citySlug}`)
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        return data
    } catch (error) {
        console.error('Error fetching course display names:', error)
        throw error
    }
}

export const fetchCourse = async (courseSlug: string): Promise<CourseDetail | null> => {
    try {
        if (!courseSlug) {
            return null;
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
        const response = await fetch(`${baseUrl}/api/course/${courseSlug}`)
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('Error fetching course:', errorData.message || `HTTP error! status: ${response.status}`)
            return null
        }
        
        const data = await response.json()
        // if image_url is null, set it to a default image
        if (!data.image_url) {
            data.image_url = '/golf-course.png'
        }
        return data
    } catch (error) {
        console.error('Error fetching course display names:', error)
        return null
    }
}
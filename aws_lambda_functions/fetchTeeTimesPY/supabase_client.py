import os
from typing import List, Any
from supabase import create_client, Client

from course import Course

from dotenv import load_dotenv

load_dotenv()

class SupabaseClient:
    def __init__(self):
        """Initialize Supabase client with environment variables."""
        url: str = os.environ.get("SUPABASE_URL")
        key: str = os.environ.get("SUPABASE_KEY")
        
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables must be set")
        
        self.supabase: Client = create_client(url, key)
    
    def fetch_all_courses(self) -> List[Course]:
        """
        Fetch all courses from the database with city names.
        
        Returns:
            List[Course]: List of Course objects with city names populated
        """
        try:
            response = (
                self.supabase.table("courses")
                .select("*, cities(name)")
                .execute()
            )
            
            courses = []
            for course_data in response.data:
                # Create Course object using the from_dict method
                # The from_dict method handles the nested cities data
                course = Course.from_dict(course_data)
                courses.append(course)
            
            return courses
            
        except Exception as e:
            print(f"Error fetching courses from Supabase: {e}")
            raise
    
    def fetch_course_by_id(self, course_id: int) -> Course:
        """
        Fetch a specific course by ID with city name.
        
        Args:
            course_id (int): The ID of the course to fetch
            
        Returns:
            Course: Course object with city name populated
        """
        try:
            response = (
                self.supabase.table("courses")
                .select("*, cities(name)")
                .eq("id", course_id)
                .execute()
            )
            
            if not response.data:
                raise ValueError(f"Course with ID {course_id} not found")
            
            course_data = response.data[0]
            return Course.from_dict(course_data)
            
        except Exception as e:
            print(f"Error fetching course {course_id} from Supabase: {e}")
            raise
    
    def fetch_courses_by_city(self, city_name: str) -> List[Course]:
        """
        Fetch all courses in a specific city.
        
        Args:
            city_name (str): Name of the city to filter by
            
        Returns:
            List[Course]: List of Course objects in the specified city
        """
        try:
            response = (
                self.supabase.table("courses")
                .select("*, cities(name)")
                .eq("cities.name", city_name)
                .execute()
            )
            
            courses = []
            for course_data in response.data:
                course = Course.from_dict(course_data)
                courses.append(course)
            
            return courses
            
        except Exception as e:
            print(f"Error fetching courses for city {city_name} from Supabase: {e}")
            raise
    
    def fetch_courses_by_api_type(self, api_type: str) -> List[Course]:
        """
        Fetch all courses that use a specific external API.
        
        Args:
            api_type (str): The external API type (e.g., "CPS", "CHRONO_LIGHTSPEED")
            
        Returns:
            List[Course]: List of Course objects using the specified API
        """
        try:
            response = (
                self.supabase.table("courses")
                .select("*, cities(name)")
                .eq("external_api", api_type)
                .execute()
            )
            
            courses = []
            for course_data in response.data:
                course = Course.from_dict(course_data)
                courses.append(course)
            
            return courses
            
        except Exception as e:
            print(f"Error fetching courses for API type {api_type} from Supabase: {e}")
            raise 
"""Course data class for ChronoGolf integration"""
from typing import Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class Course:
    """Represents a golf course with all its booking and API attributes"""
    
    id: int
    name: str
    display_name: str
    club_name: str
    city: str
    rating: float
    external_api: str
    external_api_attributes: Dict[str, Any]
    booking_visibility_days: int = 0
    requires_login: bool = False
    booking_visibility_start_time: str = ""
    timezone: str = ""

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Course':
        """Create a Course instance from a dictionary (e.g., Supabase response)
        
        Args:
            data: Dictionary containing course data from database
            
        Returns:
            Course instance
        """
        # Handle nested city data from join
        city_name = data.get('cities', {}).get('name', '') if isinstance(data.get('cities'), dict) else ''
        
        return cls(
            id=data['id'],
            name=data['name'],
            display_name=data['display_name'],
            club_name=data['club_name'],
            city=city_name,
            rating=data['rating'],
            external_api=data['external_api'],
            external_api_attributes=data.get('external_api_attributes', {}),
            booking_visibility_days=data.get('booking_visibility_days', 0),
            requires_login=data.get('requires_login', False),
            booking_visibility_start_time=data.get('booking_visibility_start_time', ''),
            timezone=data.get('timezone', '')
        )

    def to_dict(self) -> Dict[str, Any]:
        """Convert Course to a dictionary
        
        Returns:
            Dictionary representation of the Course
        """
        return {
            'id': self.id,
            'name': self.name,
            'display_name': self.display_name,
            'club_name': self.club_name,
            'city': self.city,
            'rating': self.rating,
            'external_api': self.external_api,
            'external_api_attributes': self.external_api_attributes,
            'booking_visibility_days': self.booking_visibility_days,
            'requires_login': self.requires_login,
            'booking_visibility_start_time': self.booking_visibility_start_time,
            'timezone': self.timezone
        }


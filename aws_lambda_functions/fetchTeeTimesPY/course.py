from dataclasses import dataclass
from typing import Dict, Any


@dataclass
class Course:
    id: int
    name: str
    display_name: str
    club_name: str
    city: str
    rating: float
    external_api: str
    external_api_attributes: Dict[str, Any]
    booking_visibility_days: int = 0

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Course':
        # Handle nested city data from join
        city_name = data.get('cities', {}).get('name') if 'cities' in data else data.get('city', '')
        
        return cls(
            id=data['id'],
            name=data['name'],
            display_name=data['display_name'],
            club_name=data['club_name'],
            city=city_name,
            rating=data['rating'],
            external_api=data['external_api'],
            external_api_attributes=data.get('external_api_attributes', {}),
            booking_visibility_days=data.get('booking_visibility_days', 0)
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'name': self.name,
            'display_name': self.display_name,
            'club_name': self.club_name,
            'city': self.city,
            'rating': self.rating,
            'external_api': self.external_api,
            'external_api_attributes': self.external_api_attributes,
            'booking_visibility_days': self.booking_visibility_days
        } 
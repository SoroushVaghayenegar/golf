"""TeeTime data class for ChronoGolf integration"""
from typing import Dict, Any, List
from dataclasses import dataclass, field


@dataclass
class TeeTime:
    """Represents a single tee time slot with all booking details"""
    
    start_datetime: str
    players_available: int
    available_participants: List[int]
    holes: int
    price: float
    booking_link: str
    booking_links: Dict[int, str]
    tee_time_id: str

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'TeeTime':
        """Create a TeeTime instance from a dictionary
        
        Args:
            data: Dictionary containing tee time data
            
        Returns:
            TeeTime instance
        """
        return cls(
            start_datetime=data['start_datetime'],
            players_available=data['players_available'],
            available_participants=data['available_participants'],
            holes=data['holes'],
            price=data['price'],
            booking_link=data['booking_link'],
            booking_links=data['booking_links'],
            tee_time_id=data['tee_time_id']
        )

    def to_dict(self) -> Dict[str, Any]:
        """Convert TeeTime to a dictionary
        
        Returns:
            Dictionary representation of the TeeTime
        """
        return {
            'start_datetime': self.start_datetime,
            'players_available': self.players_available,
            'available_participants': self.available_participants,
            'holes': self.holes,
            'price': self.price,
            'booking_link': self.booking_link,
            'booking_links': self.booking_links,
            'tee_time_id': self.tee_time_id
        }


from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Any


@dataclass
class TeeTime:
    start_datetime: datetime
    players_available: int
    holes: int
    price: float
    booking_link: str

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'TeeTime':
        return cls(
            start_datetime=data['start_datetime'],
            players_available=data['players_available'],
            holes=data['holes'],
            price=data['price'],
            booking_link=data['booking_link']
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            'start_datetime': self.start_datetime,
            'players_available': self.players_available,
            'holes': self.holes,
            'price': self.price,
            'booking_link': self.booking_link
        } 
from datetime import datetime, date, time

class TeeTime:
    
    start_date: date
    start_time: time
    start_datetime: datetime
    players_available: int
    course_name: str
    holes: int
    price: float
    city: str
    booking_link: str
    club_name: str
    rating: float
    cart_girl_hotness: float
    temperature: float
    precipitation_probability: int
    weather_code: str


    def __init__(self, start_date: date, start_time: time, players_available: int, course_name: str, holes: int, price: float, city: str, booking_link: str = None, club_name: str = None, rating: float = None, cart_girl_hotness: float = None, temperature: float = None, precipitation_probability: int = None, weather_code: str = None):
        self.start_date = start_date
        self.start_time = start_time
        self.start_datetime = datetime.combine(start_date, start_time)
        self.players_available = players_available
        self.course_name = course_name
        self.holes = holes
        self.price = price
        self.city = city
        self.booking_link = booking_link
        self.club_name = club_name
        self.rating = rating
        self.cart_girl_hotness = cart_girl_hotness
        self.temperature = temperature
        self.precipitation_probability = precipitation_probability
        self.weather_code = weather_code
    
    def to_dict(self):
        return {
            "start_date": self.start_date.isoformat(),
            "start_time": self.start_time.isoformat(),
            "start_datetime": self.start_datetime.isoformat(),
            "players_available": self.players_available,
            "course_name": self.course_name,
            "holes": self.holes,
            "price": self.price,
            "city": self.city,
            "booking_link": self.booking_link,
            "club_name": self.club_name,
            "rating": self.rating,
            "cart_girl_hotness": self.cart_girl_hotness,
            "temperature": self.temperature,
            "precipitation_probability": self.precipitation_probability,
            "weather_code": self.weather_code
        }
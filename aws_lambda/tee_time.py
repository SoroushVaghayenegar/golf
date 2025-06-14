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

    def __init__(self, start_date: date, start_time: time, players_available: int, course_name: str, holes: int, price: float, city: str):
        self.start_date = start_date
        self.start_time = start_time
        self.start_datetime = datetime.combine(start_date, start_time)
        self.players_available = players_available
        self.course_name = course_name
        self.holes = holes
        self.price = price
        self.city = city

    def to_dict(self):
        return {
            "start_date": self.start_date.isoformat(),
            "start_time": self.start_time.isoformat(),
            "start_datetime": self.start_datetime.isoformat(),
            "players_available": self.players_available,
            "course_name": self.course_name,
            "holes": self.holes,
            "price": self.price,
            "city": self.city
        }
from datetime import time
from enum import Enum

class Day(Enum):
    MONDAY = "Monday"
    TUESDAY = "Tuesday"
    WEDNESDAY = "Wednesday"
    THURSDAY = "Thursday"
    FRIDAY = "Friday"
    SATURDAY = "Saturday"
    SUNDAY = "Sunday"

class TeeTimeSubscription:
    def __init__(self, email: str, days: list[Day], start_time: time, end_time: time, courses: list[str], broadcast_days: list[Day]):
        self.email = email
        self.days = days
        self.start_time = start_time
        self.end_time = end_time
        self.courses = courses
        self.broadcast_days = broadcast_days

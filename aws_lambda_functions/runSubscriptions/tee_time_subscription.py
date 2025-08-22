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
    email: str
    days: list[Day]
    start_time: time
    end_time: time
    courses: list[str]
    broadcast_days: list[Day]
    token: str
    region_id: int

    def __init__(self, email: str, days: list[Day], start_time: time, end_time: time, courses: list[str], broadcast_days: list[Day], token: str, region_id: int):
        self.email = email
        self.days = days
        self.start_time = start_time
        self.end_time = end_time
        self.courses = courses
        self.broadcast_days = broadcast_days
        self.token = token
        self.region_id = region_id

    def __str__(self):
        return f"TeeTimeSubscription(email={self.email}, days={self.days}, start_time={self.start_time}, end_time={self.end_time}, courses={self.courses}, broadcast_days={self.broadcast_days}, token={self.token}, region_id={self.region_id})"
    
    # if any of the fields is empty or none, return false
    def valid_for_subscription(self) -> bool:
        if not self.email or not self.days or not self.start_time or not self.end_time or not self.courses or not self.broadcast_days or not self.token or not self.region_id:
            return False
        return True
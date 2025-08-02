import os
import requests
from datetime import time
from dotenv import load_dotenv

from tee_time_subscription import TeeTimeSubscription, Day

load_dotenv()

SUPABASE_URL = "https://pwgthtueicuiaimfaggt.supabase.co"
SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY")

class Supabase:
    def __init__(self):
        self.base_url = SUPABASE_URL
        self.api_key = SUPABASE_API_KEY
        self.headers = {
            "apikey": self.api_key,
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def _parse_time(self, time_str: str) -> time:
        """Convert time string (HH:MM:SS) to time object"""
        hours, minutes, seconds = map(int, time_str.split(':'))
        return time(hours, minutes, seconds)
    
    def _parse_day(self, day_abbr: str) -> Day:
        """Convert day abbreviation to Day enum"""
        day_mapping = {
            "Mon": Day.MONDAY,
            "Tue": Day.TUESDAY,
            "Wed": Day.WEDNESDAY,
            "Thu": Day.THURSDAY,
            "Fri": Day.FRIDAY,
            "Sat": Day.SATURDAY,
            "Sun": Day.SUNDAY
        }
        return day_mapping.get(day_abbr)

    def fetch_tee_times_subscriptions(self) -> list[TeeTimeSubscription]:
        url = f"{self.base_url}/rest/v1/tee_times_subscriptions"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        
        raw_data = response.json()
        subscriptions = []
        
        for item in raw_data:
            # Parse days
            days = [self._parse_day(day) for day in item.get('day_list', [])]
            days = [day for day in days if day is not None]  # Filter out None values
            
            # Parse broadcast days
            broadcast_days = [self._parse_day(day) for day in item.get('broadcast_day_list', [])]
            broadcast_days = [day for day in broadcast_days if day is not None]  # Filter out None values
            
            # Parse times
            start_time = self._parse_time(item.get('start_time', '00:00:00'))
            end_time = self._parse_time(item.get('end_time', '23:59:59'))
            
            # Create TeeTimeSubscription object
            subscription = TeeTimeSubscription(
                email=item.get('email'),
                days=days,
                start_time=start_time,
                end_time=end_time,
                courses=item.get('course_list', []),
                broadcast_days=broadcast_days,
                token=item.get('token'),
                region=item.get('region')
            )
            
            if subscription.valid_for_subscription():
                subscriptions.append(subscription)
        
        return subscriptions
    
    def fetch_tee_times(self, dates: list[str], region: str):
        url = f"{self.base_url}/functions/v1/tee-times?dates={','.join(dates)}&region={region}&numOfPlayers=any&holes=any"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()
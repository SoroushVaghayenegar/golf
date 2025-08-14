import os
import requests
from supabase import create_client

class SupabaseService:
    def __init__(self):
        self.base_url = os.environ.get("SUPABASE_URL")
        self.key = os.environ.get("SUPABASE_KEY")
        self.supabase = create_client(self.base_url, self.key)
        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json"
        }


    def get_tee_time_watchlists(self):
        # If a foreign key exists: tee_time_watchlists.user_id -> profiles.user_id
        # this will embed email and full_name from profiles into each result as `profiles`
        # get rows with notification_sent = false
        response = self.supabase.table("tee_time_watchlists").select("*, profiles(email, full_name)").eq("notification_sent", False).execute()
        return response.data

    def update_tee_time_watchlist_as_sent(self, watchlist_id: str):
        self.supabase.table("tee_time_watchlists").update({"notification_sent": True}).eq("id", watchlist_id).execute()
    
    def get_tee_times(self, date: str, start_time: str, end_time: str, course_ids: str, num_of_players: str, holes: str, region: str):
        url = f"{self.base_url}/functions/v1/tee-times?dates={date}&startTime={start_time}&endTime={end_time}&courseIds={course_ids}&numOfPlayers={num_of_players}&holes={holes}&region={region}"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()
        
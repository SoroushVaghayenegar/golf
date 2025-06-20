import os
import requests
from dotenv import load_dotenv

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

    def fetch_chronogolf_courses(self):
        url = f"{self.base_url}/rest/v1/chrono_courses"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return type('Response', (), {'data': response.json()})()
    
    def fetch_cps_courses(self):
        url = f"{self.base_url}/rest/v1/cps_courses"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return type('Response', (), {'data': response.json()})()
    
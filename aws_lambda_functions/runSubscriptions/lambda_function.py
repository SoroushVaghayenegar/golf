from datetime import datetime, timedelta
import sys
import json
import pytz
from supabase_client import Supabase
from tee_time_subscription import Day
from datetime import time
from email_service import send_email
import boto3
from retry import retry

sys.path.insert(0, "./python_libs")


lambda_client = boto3.client('lambda')

@retry(tries=3, delay=2)
def fetch_tee_times(dates: list[str]):
    # print list of day of week in one line
    print(f"Getting tee times for {', '.join([datetime.strptime(date, '%Y-%m-%d').strftime('%A') for date in dates])}")

    payload = {
        "queryStringParameters": {
            "dates": ','.join(dates)
        }
    }

    response = lambda_client.invoke(
        FunctionName='golfAggregate',
        InvocationType='RequestResponse',  # Or 'Event' for async
        Payload=json.dumps(payload),
    )

    response_data = json.loads(response['Payload'].read().decode("utf-8"))
    # Extract the body from the response and parse it as JSON
    return json.loads(response_data['body'])

def get_day_of_week(date: datetime) -> Day:
    day_of_week = date.strftime("%A")
    return Day(day_of_week)

def get_dates_for_days(tee_time_days: set[Day], current_date: datetime) -> dict[Day, str]:
    """
    Create a mapping of days to dates.
    If today is Tuesday and Tuesday is in tee_time_days, it maps to today's date.
    Other days map to dates after today.
    """
    day_to_date = {}
    current_day = current_date.weekday()  # Monday=0, Tuesday=1, etc.
    
    # Map weekday numbers to Day enum values
    weekday_to_day = {
        0: Day.MONDAY,
        1: Day.TUESDAY, 
        2: Day.WEDNESDAY,
        3: Day.THURSDAY,
        4: Day.FRIDAY,
        5: Day.SATURDAY,
        6: Day.SUNDAY
    }
    
    # Map Day enum values to weekday numbers
    day_to_weekday = {day: weekday for weekday, day in weekday_to_day.items()}
    
    for day in tee_time_days:
        target_weekday = day_to_weekday[day]
        
        # Calculate days difference
        days_ahead = target_weekday - current_day
        
        # If the target day is today or in the future
        if days_ahead >= 0:
            target_date = current_date + timedelta(days=days_ahead)
        else:
            # If the target day is in the past, get next occurrence
            target_date = current_date + timedelta(days=days_ahead + 7)
        
        day_to_date[day] = target_date.strftime("%Y-%m-%d")
    
    return day_to_date

def filter_tee_times(tee_times: list[dict], courses: list[str], start_time: time, end_time: time) -> list[dict]:
    filtered_times = []
    for tee_time in tee_times:
        if tee_time["course_name"] in courses:
            # Parse the start_datetime string to get the time component
            tee_time_datetime = datetime.fromisoformat(tee_time["start_datetime"])
            tee_time_time = tee_time_datetime.time()
            
            if start_time <= tee_time_time <= end_time:
                filtered_times.append(tee_time)
    
    return filtered_times

def lambda_handler(event, context):
    print("Received event:")
    print(json.dumps(event, indent=2)) 

    # today in vancouver time
    vancouver_time = datetime.now(pytz.timezone('America/Vancouver'))
    date = vancouver_time.strftime("%Y-%m-%d")
    day_of_week = get_day_of_week(vancouver_time)
    print(f"Today is {day_of_week}")

    supabase_client = Supabase()
    subscriptions = supabase_client.fetch_tee_times_subscriptions()
    
    # get list of tee_times_subscriptions that have the same day of week as the current day of week
    subscriptions_for_broadcast_today = [subscription for subscription in subscriptions if day_of_week in subscription.broadcast_days]

    if len(subscriptions_for_broadcast_today) == 0:
        print("No subscriptions to broadcast")
        return
    
    # get a set of days for subscriptions
    tee_time_days = set()
    for subscription in subscriptions_for_broadcast_today:
        tee_time_days.update(subscription.days)
    
    # Create mapping of days to dates
    day_to_date_mapping = get_dates_for_days(tee_time_days, vancouver_time)
    
    # maping of day to tee times
    tee_times = fetch_tee_times(list(day_to_date_mapping.values()))
    day_to_tee_times = {}
    for tee_time in tee_times:
        # Parse the start_datetime string to get the date and day
        tee_time_datetime = datetime.fromisoformat(tee_time["start_datetime"])
        day_of_week = get_day_of_week(tee_time_datetime)
        if day_of_week not in day_to_tee_times:
            day_to_tee_times[day_of_week] = []
        day_to_tee_times[day_of_week].append(tee_time)

    
    
    for subscription in subscriptions_for_broadcast_today:
        tee_times = day_to_tee_times[subscription.days[0]]
        filtered_tee_times = filter_tee_times(tee_times, subscription.courses, subscription.start_time, subscription.end_time)
        send_email(subscription.email, filtered_tee_times)


    print("Successfully sent emails")

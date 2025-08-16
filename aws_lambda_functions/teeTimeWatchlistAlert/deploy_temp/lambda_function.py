import sys

# Allow vendored libs when deployed (if using a python_libs folder)
sys.path.insert(0, "./python_libs")

from supabase_service import SupabaseService
from email_service import send_watchlist_email


def lambda_handler(event, context):
    supabase_service = SupabaseService()
    watchlists = supabase_service.get_tee_time_watchlists()

    emails_sent = 0
    for watchlist in watchlists:
        course_ids = ",".join([str(course["id"]) for course in watchlist["courses"]])
        tee_times = supabase_service.get_tee_times(
            date=watchlist["date"],
            start_time=watchlist["start_time"],
            end_time=watchlist["end_time"],
            course_ids=course_ids,
            num_of_players=watchlist["num_of_players"],
            holes=watchlist["holes"],
            region_id=watchlist["region_id"]
        )
        if len(tee_times) > 0:
            # Determine recipient email and full name
            profile = watchlist.get("profiles")
            email = profile.get("email")
            full_name = profile.get("full_name")
            try:
                params = {
                    "date": watchlist.get("date"),
                    "start_time": watchlist.get("start_time"),
                    "end_time": watchlist.get("end_time"),
                    "courses": ",".join([str(course["name"]) for course in watchlist["courses"]]),
                    "region_id": watchlist.get("region_id"),
                    "num_of_players": watchlist.get("num_of_players"),
                    "holes": watchlist.get("holes"),
                    # Provide courseIds explicitly for constructing /search URL
                    "courseIds": course_ids
                }
                send_watchlist_email(email=email, full_name=full_name, count=len(tee_times), params=params)
                supabase_service.update_tee_time_watchlist_as_sent(watchlist.get("id"))
                emails_sent += 1
            except Exception as e:
                print(f"Failed to send watchlist email for watchlist {watchlist.get('id')}: {e}")

    print(f"Emails sent: {emails_sent}")

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"}
    }



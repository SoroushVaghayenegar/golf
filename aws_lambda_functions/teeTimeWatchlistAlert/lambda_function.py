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
        start_time = watchlist["start_hour"]
        end_time = watchlist["end_hour"]
        processed_tee_times = watchlist.get("processed_tee_times") or []

        tee_times = supabase_service.get_tee_times(
            date=watchlist["date"],
            start_time=start_time,
            end_time=end_time,
            course_ids=course_ids,
            num_of_players=watchlist["num_of_players"],
            holes=watchlist["holes"],
            region_id=watchlist["region_id"]
        )
        
        tee_times = [tee_time for tee_time in tee_times if tee_time.get("id") not in processed_tee_times]
        if len(tee_times) > 0:
            # Determine recipient email and full name
            profile = watchlist.get("profiles")
            email = profile.get("email")
            full_name = profile.get("first_name") + " " + profile.get("last_name")
            try:
                params = {
                    "date": watchlist.get("date"),
                    "start_time": start_time,
                    "end_time": end_time,
                    "courses": ",".join([str(course["name"]) for course in watchlist["courses"]]),
                    "region_id": watchlist.get("region_id"),
                    "num_of_players": watchlist.get("num_of_players"),
                    "holes": watchlist.get("holes"),
                    "courseIds": course_ids
                }
                
                send_watchlist_email(email=email, full_name=full_name, tee_times=tee_times, params=params)
                
                tee_times_ids = [tee_time.get("id") for tee_time in tee_times]
                processed_tee_times.extend(tee_times_ids)
                supabase_service.update_tee_times_as_processed(watchlist.get("id"), processed_tee_times)

                emails_sent += 1
            except Exception as e:
                print(f"Failed to send watchlist email for watchlist {watchlist.get('id')}: {e}")

    print(f"Emails sent: {emails_sent}")

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"}
    }



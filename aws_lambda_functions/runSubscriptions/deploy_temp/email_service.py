import boto3
from email_template import generate_email_html, generate_email_text

# Time range constants
MORNING = {"name": "Morning", "start_hour": 5, "end_hour": 11}
AFTERNOON = {"name": "Afternoon", "start_hour": 11, "end_hour": 17}
EVENING = {"name": "Evening", "start_hour": 17, "end_hour": 23}


def send_email(email: str, tee_times: list[dict], token: str, region_id: int, subscription=None):
    import boto3
    
    # Sort tee_times by datetime
    tee_times.sort(key=lambda x: x['start_datetime'])
    ses = boto3.client('ses', region_name='us-west-2')
    
    # Generate HTML and text versions of the email
    html_body = generate_email_html(tee_times, token, email, subscription, region_id)
    text_body = generate_email_text(tee_times)
    
    ses.send_email(
        Source='no-reply@mail.teeclub.golf',
        Destination={
            'ToAddresses': [email]
        },
        Message={
            'Subject': {
                'Data': f'⛳ Your Golf Tee Times ({len(tee_times)} available)' if tee_times else '⛳ No Tee Times Available',
                'Charset': 'UTF-8'
            },
            'Body': {
                'Text': {
                    'Data': text_body,
                    'Charset': 'UTF-8'
                },
                'Html': {
                    'Data': html_body,
                    'Charset': 'UTF-8'
                }
            }
        }
    )
    print(f"Email sent to: {email} {len(tee_times)} tee times for region: {region_id}")


def organize_tee_times(tee_times: list[dict]):
    """
    Organize tee_times by day, then by course, then by time range (morning, afternoon, evening).
    Returns a dict: {date: {course_name: {time_range_name: [tee_times]}}}
    """
    from collections import defaultdict
    from datetime import datetime

    # Helper to get time range name
    def get_time_range(hour):
        if MORNING['start_hour'] <= hour < MORNING['end_hour']:
            return MORNING['name']
        elif AFTERNOON['start_hour'] <= hour < AFTERNOON['end_hour']:
            return AFTERNOON['name']
        elif EVENING['start_hour'] <= hour < EVENING['end_hour']:
            return EVENING['name']
        return None

    organized = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    for tee in tee_times:
        dt = datetime.fromisoformat(tee['start_datetime'].replace('Z', '+00:00'))
        date = dt.date()
        course = tee['course_name']
        hour = dt.hour
        time_range = get_time_range(hour)
        if time_range:
            organized[date][course][time_range].append(tee)
    return organized
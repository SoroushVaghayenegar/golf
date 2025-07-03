import boto3
from email_template import generate_email_html, generate_email_text

def send_email(email: str, tee_times: list[dict]):
    if len(tee_times) == 0:
        return
    
    # Sort tee_times by datetime
    tee_times.sort(key=lambda x: x['start_datetime'])
    ses = boto3.client('ses', region_name='us-west-2')
    
    # Generate HTML and text versions of the email
    html_body = generate_email_html(tee_times)
    text_body = generate_email_text(tee_times)
    
    ses.send_email(
        Source='noreply@t-times.golf',
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
    print(f"Email sent to: {email} {len(tee_times)} tee times")
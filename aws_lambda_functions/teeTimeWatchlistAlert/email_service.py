from typing import Optional, Dict, Any, List

import boto3

from email_template import (
    generate_watchlist_email_html,
    generate_watchlist_email_text,
)


def send_watchlist_email(email: str, full_name: Optional[str], tee_times: List[Dict[str, Any]], params: Dict[str, Any]) -> None:
    if not email or len(tee_times) <= 0:
        return

    ses = boto3.client("ses", region_name="us-west-2")

    count = len(tee_times)
    subject = f"⛳ TeeClub: {count} tee time{'s' if count != 1 else ''} found for you"
    html_body = generate_watchlist_email_html(full_name, tee_times, params)
    text_body = generate_watchlist_email_text(full_name, tee_times, params)

    ses.send_email(
        Source="alerts@mail.teeclub.golf",
        Destination={"ToAddresses": [email]},
        Message={
            "Subject": {"Data": subject, "Charset": "UTF-8"},
            "Body": {
                "Text": {"Data": text_body, "Charset": "UTF-8"},
                "Html": {"Data": html_body, "Charset": "UTF-8"},
            },
        },
    )



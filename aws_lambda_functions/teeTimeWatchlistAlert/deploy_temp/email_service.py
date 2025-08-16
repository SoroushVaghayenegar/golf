from typing import Optional, Dict, Any

import boto3

from email_template import (
    generate_watchlist_email_html,
    generate_watchlist_email_text,
)


def send_watchlist_email(email: str, full_name: Optional[str], count: int, params: Dict[str, Any]) -> None:
    if not email or count <= 0:
        return

    ses = boto3.client("ses", region_name="us-west-2")

    subject = f"⛳ TeeClub: {count} tee time{'s' if count != 1 else ''} found for you"
    html_body = generate_watchlist_email_html(full_name, count, params)
    text_body = generate_watchlist_email_text(full_name, count, params)

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



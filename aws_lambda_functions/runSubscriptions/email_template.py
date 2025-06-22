import pytz
from datetime import datetime

def format_time_for_email(datetime_str: str) -> str:
    """Format datetime string to Vancouver time for email display"""
    try:
        # Parse the datetime string (assuming it's in UTC)
        dt = datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
        vancouver_tz = pytz.timezone('America/Vancouver')
        vancouver_time = dt.astimezone(vancouver_tz)
        
        # Format date with ordinal suffix
        day = vancouver_time.day
        if 4 <= day <= 20 or 24 <= day <= 30:
            suffix = "th"
        else:
            suffix = ["st", "nd", "rd"][day % 10 - 1]
        
        # Format month and day
        date_str = vancouver_time.strftime(f"%B {day}{suffix}")
        
        # Add day of week
        day_of_week = vancouver_time.strftime("(%A)")
        
        # Format time
        time_str = vancouver_time.strftime("%I:%M %p")
        
        return f"{date_str} {day_of_week} at {time_str}"
    except:
        return datetime_str

def generate_rating_stars(rating: float) -> str:
    """Generate HTML for star rating"""
    if rating is None:
        return ""
    
    full_stars = int(rating)
    has_half = rating % 1 != 0
    empty_stars = 5 - full_stars - (1 if has_half else 0)
    
    stars_html = ""
    for _ in range(full_stars):
        stars_html += "★"
    if has_half:
        stars_html += "☆"
    for _ in range(empty_stars):
        stars_html += "☆"
    
    return f'<span style="color: #fbbf24; font-size: 14px;">{stars_html}</span> <span style="color: #64748b; font-size: 12px;">({rating:.1f})</span>'

def generate_tee_time_card_html(tee_time: dict, index: int) -> str:
    """Generate HTML for a single tee time card"""
    time_str = format_time_for_email(tee_time["start_datetime"])
    rating_html = generate_rating_stars(tee_time.get("rating"))
    
    # Determine button style based on booking link
    button_style = ""
    button_text = "Book Now"
    if tee_time.get("booking_link"):
        if "cps" in tee_time["booking_link"]:
            button_style = "background-color: #000000; color: #ffffff;"
            button_text = "Take me to website"
        else:
            button_style = "background-color: #22c55e; color: #ffffff;"
    else:
        button_style = "background-color: #6b7280; color: #ffffff;"
        button_text = "No booking available"
    
    # Generate booking button HTML
    booking_button_html = ""
    if tee_time.get("booking_link"):
        booking_button_html = f'''
        <a href="{tee_time["booking_link"]}" style="
            display: inline-block;
            width: 93%;
            padding: 12px 16px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            {button_style}
            transition: opacity 0.2s;
        " target="_blank" rel="noopener noreferrer">{button_text}</a>'''
    
    return f"""
    <div style="
        background-color: #ffffff;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        padding: 20px;
        margin-bottom: 16px;
        border: 1px solid #e5e7eb;
    ">
        <div style="margin-bottom: 12px;">
            <h3 style="
                margin: 0 0 4px 0;
                font-size: 18px;
                font-weight: 600;
                color: #1e293b;
                line-height: 1.3;
            ">{tee_time["course_name"]}</h3>
            <p style="
                margin: 0 0 4px 0;
                font-size: 14px;
                color: #64748b;
            ">{tee_time["city"]}</p>
            {rating_html}
        </div>
        
        <div style="margin-bottom: 16px;">
            <p style="
                margin: 0 0 8px 0;
                font-size: 18px;
                font-weight: 500;
                color: #374151;
            ">{time_str}</p>
            <p style="
                margin: 0 0 4px 0;
                font-size: 14px;
                color: #374151;
            ">{tee_time["holes"]} holes</p>
            <p style="
                margin: 0 0 8px 0;
                font-size: 14px;
                color: #374151;
            ">{tee_time["players_available"]} spots available</p>
            <p style="
                margin: 0;
                font-size: 20px;
                font-weight: 700;
                color: #2563eb;
            ">${float(tee_time["price"]):.2f}</p>
        </div>
        
        {booking_button_html}
    </div>
    """

def generate_email_html(tee_times: list[dict]) -> str:
    """Generate the complete HTML email"""
    if not tee_times:
        return generate_no_tee_times_html()
    
    cards_html = ""
    for i, tee_time in enumerate(tee_times):
        cards_html += generate_tee_time_card_html(tee_time, i)
    
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Golf Tee Times</title>
        <style>
            @media only screen and (max-width: 600px) {{
                .container {{
                    padding: 16px !important;
                }}
                .card {{
                    padding: 16px !important;
                }}
            }}
        </style>
    </head>
    <body style="
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        background-color: #f8fafc;
        color: #1e293b;
    ">
        <div style="
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            min-height: 100vh;
        ">
            <!-- Header -->
            <div style="
                background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                padding: 32px 24px;
                text-align: center;
            ">
                <h1 style="
                    margin: 0;
                    color: #ffffff;
                    font-size: 28px;
                    font-weight: 700;
                    letter-spacing: -0.025em;
                ">⛳ Your Golf Tee Times</h1>
                <p style="
                    margin: 8px 0 0 0;
                    color: #dcfce7;
                    font-size: 16px;
                    opacity: 0.9;
                ">Ready to hit the courses?</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 24px;">
                <p style="
                    margin: 0 0 24px 0;
                    font-size: 16px;
                    color: #64748b;
                    line-height: 1.6;
                ">
                    Here are the latest tee times available for your preferred courses and times:
                </p>
                
                {cards_html}
                
                <!-- Footer -->
                <div style="
                    margin-top: 32px;
                    padding-top: 24px;
                    border-top: 1px solid #e5e7eb;
                    text-align: center;
                ">
                    <p style="
                        margin: 0 0 16px 0;
                        font-size: 14px;
                        color: #64748b;
                    ">
                        You're receiving this email because you're subscribed to golf tee time notifications.
                    </p>
                    <p style="
                        margin: 0;
                        font-size: 12px;
                        color: #9ca3af;
                    ">
                        © 2024 T-Times Golf. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

def generate_no_tee_times_html() -> str:
    """Generate HTML for when no tee times are available"""
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>No Tee Times Available</title>
    </head>
    <body style="
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        background-color: #f8fafc;
        color: #1e293b;
    ">
        <div style="
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            min-height: 100vh;
        ">
            <!-- Header -->
            <div style="
                background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                padding: 32px 24px;
                text-align: center;
            ">
                <h1 style="
                    margin: 0;
                    color: #ffffff;
                    font-size: 28px;
                    font-weight: 700;
                    letter-spacing: -0.025em;
                ">⛳ Golf Tee Times</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 24px; text-align: center;">
                <div style="
                    background-color: #fef3c7;
                    border: 1px solid #f59e0b;
                    border-radius: 8px;
                    padding: 24px;
                    margin: 24px 0;
                ">
                    <h2 style="
                        margin: 0 0 12px 0;
                        color: #92400e;
                        font-size: 20px;
                        font-weight: 600;
                    ">No Tee Times Available</h2>
                    <p style="
                        margin: 0;
                        color: #92400e;
                        font-size: 16px;
                        line-height: 1.5;
                    ">
                        Unfortunately, no tee times are currently available for your preferences. 
                        Check back later or adjust your subscription settings.
                    </p>
                </div>
                
                <!-- Footer -->
                <div style="
                    margin-top: 32px;
                    padding-top: 24px;
                    border-top: 1px solid #e5e7eb;
                ">
                    <p style="
                        margin: 0;
                        font-size: 12px;
                        color: #9ca3af;
                    ">
                        © 2024 T-Times Golf. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

def generate_email_text(tee_times: list[dict]) -> str:
    """Generate plain text version of the email"""
    if not tee_times:
        return """Your Golf Tee Times

No tee times are currently available for your preferences. 
Check back later or adjust your subscription settings.

© 2024 T-Times Golf. All rights reserved."""
    
    text = "Your Golf Tee Times\n\n"
    text += "Here are the latest tee times available for your preferred courses and times:\n\n"
    
    for i, tee_time in enumerate(tee_times, 1):
        time_str = format_time_for_email(tee_time["start_datetime"])
        rating_text = f" (Rating: {tee_time.get('rating', 'N/A')})" if tee_time.get("rating") else ""
        
        text += f"{i}. {tee_time['course_name']}{rating_text}\n"
        text += f"   Location: {tee_time['city']}\n"
        text += f"   Time: {time_str}\n"
        text += f"   {tee_time['holes']} holes, {tee_time['players_available']} spots available\n"
        text += f"   Price: ${float(tee_time['price']):.2f}\n"
        if tee_time.get("booking_link"):
            text += f"   Book here: {tee_time['booking_link']}\n"
        text += "\n"
    
    text += "\n© 2024 T-Times Golf. All rights reserved."
    return text 
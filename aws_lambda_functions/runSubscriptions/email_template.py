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

def generate_weather_html(tee_time: dict) -> str:
    """Generate HTML for weather information"""
    weather_code = tee_time.get("weather_code")
    temperature = tee_time.get("temperature")
    precipitation_probability = tee_time.get("precipitation_probability")
    
    # If no weather data, return empty string
    if not weather_code and temperature is None and precipitation_probability is None:
        return ""
    
    # Get weather emoji based on weather code
    weather_emoji = "☁️"  # default cloud
    if weather_code:
        if "Clear" in weather_code:
            weather_emoji = "☀️"
        elif "Rain" in weather_code or "Drizzle" in weather_code:
            weather_emoji = "🌧️"
        elif "Snow" in weather_code:
            weather_emoji = "❄️"
        elif "Thunderstorm" in weather_code:
            weather_emoji = "⛈️"
        elif "Fog" in weather_code:
            weather_emoji = "🌫️"
    
    weather_details = []
    
    # Add temperature if available
    if temperature is not None:
        weather_details.append(f"🌡️ {round(temperature)}°C")
    
    # Add precipitation probability if available
    if precipitation_probability is not None:
        weather_details.append(f"💧 {round(precipitation_probability)}%")
    
    weather_info = " • ".join(weather_details)
    
    # Light theme weather section
    weather_html_light = f'''
    <div class="weather-section-light" style="
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 8px;
        margin-bottom: 12px;
    ">
        <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 16px;">{weather_emoji}</span>
            <div style="flex: 1;">
                {f'<div style="font-size: 12px; font-weight: 500; color: #374151; margin-bottom: 1px;">{weather_info}</div>' if weather_info else ''}
                {f'<div style="font-size: 10px; color: #6b7280;">{weather_code}</div>' if weather_code else ''}
            </div>
        </div>
    </div>'''
    
    # Dark theme weather section
    weather_html_dark = f'''
    <div class="weather-section-dark" style="
        background: #374151;
        border: 1px solid #4b5563;
        border-radius: 6px;
        padding: 8px;
        margin-bottom: 12px;
    ">
        <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 16px;">{weather_emoji}</span>
            <div style="flex: 1;">
                {f'<div style="font-size: 12px; font-weight: 500; color: #e2e8f0; margin-bottom: 1px;">{weather_info}</div>' if weather_info else ''}
                {f'<div style="font-size: 10px; color: #94a3b8;">{weather_code}</div>' if weather_code else ''}
            </div>
        </div>
    </div>'''
    
    weather_html = weather_html_light + weather_html_dark
    
    return weather_html

def generate_tee_time_card_html(tee_time: dict, index: int) -> str:
    """Generate HTML for a single tee time card (optimized for two-column layout)"""
    time_str = format_time_for_email(tee_time["start_datetime"])
    rating_html = generate_rating_stars(tee_time.get("rating"))
    weather_html = generate_weather_html(tee_time)
    
    # Determine button style based on booking link
    button_style = ""
    button_text = "Book Now"
    if tee_time.get("booking_link"):
        if "cps" in tee_time["booking_link"]:
            button_style = "background-color: #000000; color: #ffffff;"
            button_text = "View Course Website"
        else:
            button_style = "background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff;"
            button_text = "Book on ChronoGolf"
    else:
        button_style = "background-color: #6b7280; color: #ffffff;"
        button_text = "No booking available"
    
    # Generate booking button HTML
    booking_button_html = ""
    if tee_time.get("booking_link"):
        booking_button_html = f'''
        <div style="padding: 0 2px;">
            <a href="{tee_time["booking_link"]}" style="
                display: block;
                width: 100%;
                padding: 10px 12px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                text-align: center;
                font-size: 13px;
                {button_style}
                transition: opacity 0.2s;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                box-sizing: border-box;
            " target="_blank" rel="noopener noreferrer">{button_text}</a>
        </div>'''
    
    return f"""
    <td style="
        width: 50%;
        vertical-align: top;
        padding: 0 8px 16px 8px;
    ">
        <div style="
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            padding: 16px;
            border: 1px solid #e5e7eb;
            height: 100%;
        ">
            <div style="margin-bottom: 10px;">
                <h3 style="
                    margin: 0 0 4px 0;
                    font-size: 16px;
                    font-weight: 600;
                    color: #1e293b;
                    line-height: 1.3;
                ">{tee_time["course_name"]}</h3>
                <p style="
                    margin: 0 0 4px 0;
                    font-size: 13px;
                    color: #64748b;
                ">{tee_time["city"]}</p>
                {rating_html}
            </div>
            
            {weather_html}
            
            <div style="margin-bottom: 14px;">
                <p style="
                    margin: 0 0 6px 0;
                    font-size: 16px;
                    font-weight: 500;
                    color: #374151;
                ">{time_str}</p>
                <div style="display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap;">
                    <span style="
                        background-color: #f1f5f9;
                        color: #475569;
                        padding: 3px 6px;
                        border-radius: 10px;
                        font-size: 11px;
                        font-weight: 500;
                    ">{tee_time["holes"]} holes</span>
                    <span style="
                        background-color: #dcfce7;
                        color: #15803d;
                        padding: 3px 6px;
                        border-radius: 10px;
                        font-size: 11px;
                        font-weight: 500;
                    ">{tee_time["players_available"]} spots</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <p style="
                        margin: 0;
                        font-size: 20px;
                        font-weight: 700;
                        color: #2563eb;
                    ">${float(tee_time["price"]):.2f}</p>
                    <p style="
                        margin: 0;
                        font-size: 11px;
                        color: #64748b;
                    ">per person</p>
                </div>
            </div>
            
            {booking_button_html}
        </div>
    </td>
    """

def generate_email_html(tee_times: list[dict]) -> str:
    """Generate the complete HTML email"""
    if not tee_times:
        return generate_no_tee_times_html()
    
    # Generate cards in rows of two
    cards_html = ""
    for i in range(0, len(tee_times), 2):
        cards_html += '<table class="two-column-table" style="width: 100%; border-collapse: collapse; margin-bottom: 0;"><tr>'
        
        # First card
        cards_html += generate_tee_time_card_html(tee_times[i], i)
        
        # Second card (if exists), otherwise empty cell
        if i + 1 < len(tee_times):
            cards_html += generate_tee_time_card_html(tee_times[i + 1], i + 1)
        else:
            cards_html += '<td style="width: 50%; vertical-align: top; padding: 0 8px 16px 8px;"></td>'
        
        cards_html += '</tr></table>'
    
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
                .two-column-table {{
                    display: block !important;
                    width: 100% !important;
                }}
                .two-column-table tr {{
                    display: block !important;
                }}
                .two-column-table td {{
                    display: block !important;
                    width: 100% !important;
                    padding: 0 0 16px 0 !important;
                }}
            }}
            
            [data-ogsc] .weather-section-light {{ display: none !important; }}
            [data-ogsc] .weather-section-dark {{ display: block !important; }}
            .weather-section-dark {{ display: none; }}
            
            @media (prefers-color-scheme: dark) {{
                .weather-section-light {{ display: none !important; }}
                .weather-section-dark {{ display: block !important; }}
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
                        © 2025 T-Times Golf. All rights reserved.
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
                        © 2025 T-Times Golf. All rights reserved.
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

© 2025 T-Times Golf. All rights reserved."""
    
    text = "Your Golf Tee Times\n\n"
    text += "Here are the latest tee times available for your preferred courses and times:\n\n"
    
    for i, tee_time in enumerate(tee_times, 1):
        time_str = format_time_for_email(tee_time["start_datetime"])
        rating_text = f" (Rating: {tee_time.get('rating', 'N/A')})" if tee_time.get("rating") else ""
        
        text += f"{i}. {tee_time['course_name']}{rating_text}\n"
        text += f"   Location: {tee_time['city']}\n"
        text += f"   Time: {time_str}\n"
        
        # Add weather information if available
        weather_parts = []
        if tee_time.get("temperature") is not None:
            weather_parts.append(f"Temperature: {round(tee_time['temperature'])}°C")
        if tee_time.get("precipitation_probability") is not None:
            weather_parts.append(f"Rain chance: {round(tee_time['precipitation_probability'])}%")
        if tee_time.get("weather_code"):
            weather_parts.append(f"Conditions: {tee_time['weather_code']}")
        
        if weather_parts:
            text += f"   Weather: {' | '.join(weather_parts)}\n"
        
        text += f"   {tee_time['holes']} holes, {tee_time['players_available']} spots available\n"
        text += f"   Price: ${float(tee_time['price']):.2f} per person\n"
        if tee_time.get("booking_link"):
            booking_text = "View Course Website" if "cps" in tee_time["booking_link"] else "Book on ChronoGolf"
            text += f"   {booking_text}: {tee_time['booking_link']}\n"
        text += "\n"
    
    text += "\n© 2025 T-Times Golf. All rights reserved."
    return text 
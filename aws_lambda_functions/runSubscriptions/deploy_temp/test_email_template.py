#!/usr/bin/env python3
"""
Test script for the email template
Run this to see how the email will look
"""

from email_template import generate_email_html, generate_email_text

# Sample tee time data for testing
sample_tee_times = [
    {
        "start_datetime": "2024-01-15T14:30:00Z",
        "course_name": "Fraserview Golf Course",
        "city": "Vancouver",
        "holes": 18,
        "players_available": 2,
        "price": 45.00,
        "booking_link": "https://example.com/book/fraserview",
        "rating": 4.2
    },
    {
        "start_datetime": "2024-01-15T16:00:00Z",
        "course_name": "Burnaby Mountain Golf Course",
        "city": "Burnaby",
        "holes": 18,
        "players_available": 1,
        "price": 52.50,
        "booking_link": "https://cps.example.com/burnaby",
        "rating": 3.8
    },
    {
        "start_datetime": "2024-01-15T17:30:00Z",
        "course_name": "Langara Golf Course",
        "city": "Vancouver",
        "holes": 18,
        "players_available": 3,
        "price": 38.00,
        "booking_link": None,
        "rating": None
    }
]

def test_email_template():
    print("Testing email template...")
    
    # Test with tee times
    print("\n=== HTML Email with Tee Times ===")
    html_content = generate_email_html(sample_tee_times)
    print("HTML generated successfully!")
    print(f"HTML length: {len(html_content)} characters")
    
    print("\n=== Text Email with Tee Times ===")
    text_content = generate_email_text(sample_tee_times)
    print(text_content)
    
    # Test with no tee times
    print("\n=== HTML Email with No Tee Times ===")
    html_no_times = generate_email_html([])
    print("HTML generated successfully!")
    print(f"HTML length: {len(html_no_times)} characters")
    
    print("\n=== Text Email with No Tee Times ===")
    text_no_times = generate_email_text([])
    print(text_no_times)
    
    # Save HTML to file for preview
    with open("email_preview.html", "w", encoding="utf-8") as f:
        f.write(html_content)
    print("\nHTML email saved to 'email_preview.html' - open this in a browser to preview")

if __name__ == "__main__":
    from email_template import generate_email_html
    import datetime

    # Sample tee_times data
    tee_times = [
        {
            "start_datetime": "2024-12-09T07:30:00Z",
            "course_name": "Pebble Beach Golf Links",
            "city": "Monterey, CA",
            "holes": 18,
            "players_available": 12,
            "price": 250.00,
        },
        {
            "start_datetime": "2024-12-09T13:00:00Z",
            "course_name": "Pebble Beach Golf Links",
            "city": "Monterey, CA",
            "holes": 18,
            "players_available": 8,
            "price": 250.00,
        },
        {
            "start_datetime": "2024-12-09T18:00:00Z",
            "course_name": "Pebble Beach Golf Links",
            "city": "Monterey, CA",
            "holes": 18,
            "players_available": 3,
            "price": 250.00,
        },
        {
            "start_datetime": "2024-12-09T08:00:00Z",
            "course_name": "Augusta National Golf Club",
            "city": "Augusta, GA",
            "holes": 18,
            "players_available": 15,
            "price": 400.00,
        },
        {
            "start_datetime": "2024-12-09T15:00:00Z",
            "course_name": "Augusta National Golf Club",
            "city": "Augusta, GA",
            "holes": 18,
            "players_available": 6,
            "price": 400.00,
        },
        {
            "start_datetime": "2024-12-09T19:00:00Z",
            "course_name": "Augusta National Golf Club",
            "city": "Augusta, GA",
            "holes": 18,
            "players_available": 0,
            "price": 400.00,
        },
        {
            "start_datetime": "2024-12-11T08:00:00Z",
            "course_name": "St. Andrews Old Course",
            "city": "St. Andrews, Scotland",
            "holes": 18,
            "players_available": 5,
            "price": 300.00,
        },
        {
            "start_datetime": "2024-12-11T14:00:00Z",
            "course_name": "St. Andrews Old Course",
            "city": "St. Andrews, Scotland",
            "holes": 18,
            "players_available": 11,
            "price": 300.00,
        },
        {
            "start_datetime": "2024-12-11T18:00:00Z",
            "course_name": "St. Andrews Old Course",
            "city": "St. Andrews, Scotland",
            "holes": 18,
            "players_available": 7,
            "price": 300.00,
        },
        {
            "start_datetime": "2024-12-14T09:00:00Z",
            "course_name": "Torrey Pines Golf Course",
            "city": "La Jolla, CA",
            "holes": 18,
            "players_available": 9,
            "price": 180.00,
        },
    ]

    # Sample token for testing
    test_token = "abc123xyz789"
    test_email = "test@example.com"
    
    html = generate_email_html(tee_times, test_token, test_email)
    with open("test_email_output.html", "w") as f:
        f.write(html)
    print("Test email HTML written to test_email_output.html") 
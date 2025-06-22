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
    test_email_template() 
from typing import Optional, Dict, Any
from urllib.parse import urlencode


def _first_name_from_full_name(full_name: Optional[str]) -> str:
    if not full_name:
        return "there"
    return full_name.split(" ")[0].strip() or "there"


def _extract_hour_component(time_str: Optional[str]) -> Optional[int]:
    if not time_str:
        return None
    try:
        parts = str(time_str).split(":")
        hour = int(parts[0])
        if 0 <= hour <= 23:
            return hour
    except Exception:
        return None
    return None


def _build_search_url(params: Dict[str, Any]) -> str:
    base_url = "https://www.teeclub.golf/search"

    date = params.get("date")

    start_hour = _extract_hour_component(params.get("start_time") or params.get("startTime"))
    end_hour = _extract_hour_component(params.get("end_time") or params.get("endTime"))
    time_range = None
    if start_hour is not None and end_hour is not None:
        time_range = f"{start_hour}-{end_hour}"

    region = params.get("region") or params.get("region_id") or params.get("regionId")
    players = params.get("num_of_players") or params.get("players")
    holes = params.get("holes")
    course_ids = params.get("courseIds")
    courses = params.get("courses")

    query: Dict[str, Any] = {}
    if date:
        query["dates"] = str(date)
    if players:
        query["players"] = str(players)
    if holes:
        query["holes"] = str(holes)
    if region:
        query["region"] = str(region)
    if time_range:
        query["timeRange"] = time_range
    if course_ids:
        query["courseIds"] = str(course_ids)
    elif courses:
        query["courses"] = str(courses)

    query_string = urlencode(query)
    return f"{base_url}?{query_string}" if query_string else base_url


def generate_watchlist_email_html(full_name: Optional[str], count: int, params: Dict[str, Any]) -> str:
    first_name = _first_name_from_full_name(full_name)
    plural = "tee time" if count == 1 else "tee times"

    date = params.get("date") or "—"
    start_time = params.get("start_time") or "—"
    end_time = params.get("end_time") or params.get("endTime") or "—"
    course_names = params.get("courses") or "—"
    region = params.get("region") or params.get("region_id") or "—"
    num_of_players = params.get("num_of_players") or params.get("players") or "—"
    holes = params.get("holes") or "—"
    search_url = _build_search_url(params)

    return f"""
    <!doctype html>
    <html lang=\"en\">
      <head>
        <meta charset=\"utf-8\" />
        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
        <title>TeeClub Watchlist Alert</title>
        <style>
          body {{
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
            color: #0f172a;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          }}
          .container {{
            max-width: 640px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(2,6,23,0.08);
            overflow: hidden;
          }}
          .header {{
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            padding: 20px 24px;
            text-align: center;
          }}
          .logo {{
            display: inline-block;
            width: 88px;
            height: 88px;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid rgba(255,255,255,0.9);
            box-shadow: 0 2px 6px rgba(2,6,23,0.15);
          }}
          .content {{
            padding: 24px;
          }}
          .title {{
            margin: 0 0 8px 0;
            font-size: 22px;
            font-weight: 700;
            color: #0f172a;
          }}
          .subtitle {{
            margin: 0 0 16px 0;
            color: #334155;
            font-size: 15px;
            line-height: 1.6;
          }}
          .badge {{
            display: inline-block;
            background: #dcfce7;
            color: #166534;
            border: 1px solid #86efac;
            border-radius: 9999px;
            padding: 6px 12px;
            font-weight: 600;
            font-size: 13px;
            margin: 8px 0 16px 0;
          }}
          .cta {{
            text-align: center;
            margin: 16px 0 24px 0;
          }}
          .details {{
            margin-top: 10px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 14px 16px;
            font-size: 14px;
            color: #334155;
          }}
          .details h3 {{
            margin: 0 0 8px 0;
            font-size: 14px;
            color: #0f172a;
          }}
          .details ul {{
            margin: 0;
            padding-left: 18px;
          }}
          .details li {{
            margin: 4px 0;
          }}
          .cta a {{
            display: inline-block;
            background: #166534;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 18px;
            border-radius: 10px;
            font-weight: 700;
            font-size: 15px;
            box-shadow: 0 6px 14px rgba(2,6,23,0.12);
          }}
          .footer {{
            padding: 18px 24px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 12px;
          }}
        </style>
      </head>
      <body>
        <div class=\"container\">
          <div class=\"header\">
            <img class=\"logo\" src=\"https://teeclub-admin.s3.us-west-2.amazonaws.com/logo/logo.png\" alt=\"TeeClub\" />
          </div>
          <div class=\"content\">
            <h1 class=\"title\">Hi {first_name}, we found your {plural}! ⛳</h1>
            <p class=\"subtitle\">Your tee time watchlist just matched <strong>{count}</strong> {plural}. Jump in now before they’re gone.</p>
            <span class=\"badge\">{count} {plural} found</span>
            <div class=\"cta\">
              <a href=\"{search_url}\" target=\"_blank\" rel=\"noopener noreferrer\">View tee times on TeeClub</a>
            </div>
            <div class=\"details\">
              <h3>Watchlist filters</h3>
              <ul>
                <li><strong>Date</strong>: {date}</li>
                <li><strong>Time</strong>: {start_time} – {end_time}</li>
                <li><strong>Courses</strong>: {course_names}</li>
                <li><strong>Region</strong>: {region}</li>
                <li><strong>Players</strong>: {num_of_players}</li>
                <li><strong>Holes</strong>: {holes}</li>
              </ul>
            </div>
            <p class=\"subtitle\" style=\"margin-top: 8px; font-size: 13px; color: #475569;\">If the button doesn’t work, copy and paste this link into your browser: <span style=\"color:#0ea5e9; word-break: break-all;\">{search_url}</span></p>
          </div>
          <div class=\"footer\">© {__import__('datetime').datetime.now().year} TeeClub. All rights reserved.</div>
        </div>
      </body>
    </html>
    """


def generate_watchlist_email_text(full_name: Optional[str], count: int, params: Dict[str, Any]) -> str:
    first_name = _first_name_from_full_name(full_name)
    plural = "tee time" if count == 1 else "tee times"
    date = params.get("date") or "—"
    start_time = params.get("start_time") or "—"
    end_time = params.get("end_time") or params.get("endTime") or "—"
    course_names = params.get("courses") or "—"
    region = params.get("region") or params.get("region_id") or "—"
    num_of_players = params.get("num_of_players") or params.get("players") or "—"
    holes = params.get("holes") or "—"
    search_url = _build_search_url(params)

    return (
        f"Hi {first_name},\n\n"
        f"Good news — your watchlist found {count} {plural}.\n\n"
        f"Watchlist filters:\n"
        f"- Date: {date}\n"
        f"- Time: {start_time} – {end_time}\n"
        f"- Courses: {course_names}\n"
        f"- Region: {region}\n"
        f"- Players: {num_of_players}\n"
        f"- Holes: {holes}\n\n"
        f"Open TeeClub to view them: {search_url}\n\n"
        f"— TeeClub"
    )



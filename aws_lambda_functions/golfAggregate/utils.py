from city import City

course_to_city = {
        "Burnaby Mountain Golf": City.BURNABY,
        "CANAL" : City.SURREY,
        "Country Meadows Golf Club": City.RICHMOND,
        "Fort Langley Golf Course": City.LANGLEY,
        "Fraserview Golf Course": City.VANCOUVER,
        "Furry Creek Golf & Country Club": City.SQUAMISH,
        "Golden Eagle Golf Club (North Course)": City.PITT_MEADOWS,
        "Golden Eagle Golf Club (South Course)": City.PITT_MEADOWS,
        "GreenTee (Langley) Country Club": City.LANGLEY,
        "GreenTee The Sky Course (Langley)": City.LANGLEY,
        "Hazelmere": City.SURREY,
        "Langara Golf Course": City.VANCOUVER,
        "McCleery Golf Course": City.VANCOUVER,
        "Meadow Gardens Golf Club": City.PITT_MEADOWS,
        "Morgan Creek Golf Course": City.SURREY,
        "Musqueam Golf & Learning Academy": City.VANCOUVER,
        "Mylora Executive Golf Club": City.RICHMOND,
        "RIDGE": City.SURREY,
        "Riverway Golf": City.BURNABY,
        "Savage Creek Golf Club": City.RICHMOND,
        "Surrey Golf Club (Main Course)": City.SURREY,
        "Surrey Golf Club (Willows 9)": City.SURREY,
        "Swaneset Resort Course": City.PITT_MEADOWS,
        "The Redwoods": City.LANGLEY,
        "University Golf Club": City.VANCOUVER
    }

def course_name_to_city(course_name: str) -> City:
    return course_to_city[course_name].value
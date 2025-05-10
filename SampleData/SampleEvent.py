import os
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone

now = datetime.now(timezone.utc)
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Sample data
events = [
    {
        "title": "Coldplay Live",
        "description": "A live concert by Coldplay.",
        "event_type": "music",
        "start_time": (now + timedelta(days=3)).isoformat(),
        "end_time": (now + timedelta(days=3, hours=2)).isoformat(),
        "latitude": 37.7749,
        "longitude": -122.4194,
        "source": "manual",
        "external_id": "event_001"
    },
    {
        "title": "Tech Meetup",
        "description": "Monthly tech meetup for developers.",
        "event_type": "tech",
        "start_time": (now + timedelta(days=7)).isoformat(),
        "end_time": (now + timedelta(days=7, hours=2)).isoformat(),
        "latitude": 34.0522,
        "longitude": -118.2437,
        "source": "manual",
        "external_id": "event_002"
    },
    {
        "title": "Yoga in the Park",
        "description": "Morning yoga session in Central Park.",
        "event_type": "wellness",
        "start_time": (now + timedelta(days=1)).isoformat(),
        "end_time": (now + timedelta(days=1, hours=1)).isoformat(),
        "latitude": 40.7851,
        "longitude": -73.9683,
        "source": "manual",
        "external_id": "event_003"
    }
]

# Insert data into Supabase
response = supabase.table("events").insert(events).execute()

if response.data:
    print("✅ Sample events inserted successfully.")
else:
    print(f"❌ Failed to insert: {response.data}")

import os
import uuid
import datetime
import random
import json
from faker import Faker
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Initialize Faker
fake = Faker()

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Baby profile ID (replace with a valid ID from your baby_profiles table)
BABY_ID = "3296e4f0-d710-44e4-80bf-570493a64d27"
USER_ID = "bf3464f2-b5e0-416d-902e-c23d62f0361e"

def insert_fake_data(json_file="baby_logs_10_days.json"):
    with open(json_file, "r") as f:
        data = json.load(f)

    try:
        for log in data:
            log["baby_id"] = BABY_ID
            result = supabase.table("baby_logs").upsert(log).execute()
            print(f"Inserted fake data: {result.data}")
    except Exception as e:
        print(f"Error inserting data: {e}")

if __name__ == "__main__":
    insert_fake_data()

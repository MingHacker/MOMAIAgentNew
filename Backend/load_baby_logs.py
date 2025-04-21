import json
from datetime import datetime
from dotenv import load_dotenv
import os
import argparse
from supabase import create_client
from pydantic import BaseModel
from typing import Literal
from dateutil.parser import parse  # Handles various datetime formats

# Load environment variables
load_dotenv()

# Define the data model matching your table structure
class BabyLogCreate(BaseModel):
    baby_id: str
    log_type: Literal["feeding", "diaper", "sleep", "cry", "bowel", "outside"]
    log_data: dict
    logged_at: datetime

def load_logs(baby_id: str, json_path: str):
    # Initialize Supabase client
    supabase = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_KEY")
    )
    
    # Load and parse JSON data
    with open(json_path, 'r', encoding='utf-8') as f:
        logs = json.load(f)
    
    # Transform data and validate with Pydantic
    valid_logs = []
    errors = []
    
    for log in logs:
        try:
            # Add baby_id and parse datetime
            log_data = log.get('log_data', {})
            transformed = {
                'baby_id': baby_id,
                'log_type': log['log_type'],
                'log_data': log_data,
                'logged_at': parse(log['logged_at']).isoformat()  # Convert to ISO string
            }
            
            # Validate with Pydantic model
            BabyLogCreate(**transformed)
            valid_logs.append(transformed)
        except Exception as e:
            errors.append({
                'log': log,
                'error': str(e)
            })
    
    # Insert valid records in batches
    if valid_logs:
        # Supabase can handle 1000s of records per insert
        result = supabase.table('baby_logs').insert(valid_logs).execute()
        print(f"Successfully inserted {len(result.data)} records")
    
    # Report errors
    if errors:
        print(f"\nEncountered {len(errors)} errors:")
        for error in errors[-5:]:  # Show last 5 errors to avoid flooding console
            print(f"Error: {error['error']}")
            print(f"Invalid log: {json.dumps(error['log'], indent=2)}")
            
    # Save full error log
    if errors:
        with open('load_errors.json', 'w') as f:
            json.dump(errors, f, indent=2)
        print("Full error log saved to load_errors.json")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Load baby logs into Supabase')
    parser.add_argument('baby_id', type=str, help='Baby ID to associate with logs')
    parser.add_argument('--json', type=str, default='SampleData/baby_logs_4_month_last_7_days.json',
                       help='Path to JSON file (default: SampleData/baby_logs_4_month_last_7_days.json)')
    
    args = parser.parse_args()
    
    load_logs(args.baby_id, args.json)

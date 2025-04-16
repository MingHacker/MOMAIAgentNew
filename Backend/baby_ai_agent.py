import os
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from supabase import Client, create_client
from dotenv import load_dotenv

# Import models from the dedicated models file
from main import ReminderCreate, BabyLogCreate


load_dotenv()

class BabyAIAgent:
    """
    Agent responsible for analyzing baby logs and generating reminders.
    """
    def __init__(self, supabase_client: Client):
        """
        Initializes the agent with a Supabase client instance.

        Args:
            supabase_client: An initialized Supabase client.
        """
        if not supabase_client:
            raise ValueError("Supabase client must be provided.")
        self.supabase = supabase_client

    def _fetch_recent_logs(self, baby_id: str, lookback_hours: int = 48) -> List[Dict[str, Any]]:
        """
        Fetches baby logs within a specified lookback period.

        Args:
            baby_id: The ID of the baby.
            lookback_hours: How many hours back to fetch logs (default: 24).

        Returns:
            A list of baby log dictionaries, ordered by logged_at descending.
        """
        try:
            time_threshold = datetime.now(timezone.utc) - timedelta(hours=lookback_hours)
            result = self.supabase.table("baby_logs") \
                .select("*") \
                .eq("baby_id", baby_id) \
                .gte("logged_at", time_threshold.isoformat()) \
                .order("logged_at", desc=True) \
                .execute()
            return result.data if result.data else []
        except Exception as e:
            print(f"Error fetching recent logs for baby {baby_id}: {e}")
            return []

    def generate_reminders_from_baby_logs(self, baby_id: str, current_time: datetime) -> List[Dict[str, Any]]:
        """
        Analyzes recent baby logs and generates appropriate reminders.

        Args:
            baby_id: The UUID of the baby.
            current_time: The timestamp at the time of generation (should be timezone-aware, preferably UTC).

        Returns:
            A list of newly created reminder dictionaries.
        """
        print(f"Generating reminders for baby {baby_id} at {current_time.isoformat()}")
        recent_logs = self._fetch_recent_logs(baby_id)
        if not recent_logs:
            print(f"No recent logs found for baby {baby_id}. Cannot generate reminders.")
            return []

        # --- Reminder Logic (Basic Example) ---
        # This logic needs refinement based on actual requirements/patterns.
        # It currently checks the time since the last log of each type.

        reminders_to_create: List[ReminderCreate] = []
        last_log_times = {
            "feeding": None,
            "diaper": None,
            "sleep": None # Assuming 'sleep' logs mark the *end* of a sleep period
        }

        # Find the latest log time for each relevant type
        for log in recent_logs:
            log_type = log.get("log_type")
            logged_at_str = log.get("logged_at")
            if log_type in last_log_times and logged_at_str:
                logged_at = datetime.fromisoformat(logged_at_str)
                if last_log_times[log_type] is None or logged_at > last_log_times[log_type]:
                     last_log_times[log_type] = logged_at

        # Define typical intervals (these should ideally be configurable per baby)
        intervals = {
            "feeding": timedelta(hours=3),
            "diaper": timedelta(hours=2),
            "sleep": timedelta(hours=4) # Time since last *waking up*
        }

        # Generate reminders if interval has passed since last log
        for log_type, interval in intervals.items():
            last_time = last_log_times.get(log_type)
            # Map log type to reminder type (ensure these match ReminderCreate Literal)
            # Type assertion to ensure it matches the Literal
            reminder_type: Literal["feeding", "diaper", "sleep"] = log_type

            if last_time:
                # Ensure the time is timezone-aware (UTC) before adding interval
                if last_time.tzinfo is None:
                    last_time = last_time.replace(tzinfo=timezone.utc) # Assume UTC if naive
                
                next_expected_time = last_time + interval
                if current_time >= next_expected_time:
                    # Check if a similar reminder already exists and is not completed
                    existing_reminder = self._check_existing_reminder(baby_id, reminder_type, next_expected_time)
                    if not existing_reminder:
                        print(f"Generating {reminder_type} reminder for baby {baby_id}")
                        reminders_to_create.append(
                            ReminderCreate(
                                baby_id=baby_id,
                                reminder_type=reminder_type,
                                reminder_time=next_expected_time,  # Schedule for the expected time
                                notes=f"Based on last {log_type} at {last_time.strftime('%H:%M')}",
                            )
                        )
                    else:
                        print(f"Skipping {reminder_type} reminder for baby {baby_id} - similar one exists.")

            else:
                # No recent log of this type, maybe generate a baseline reminder?
                # Or requires manual setup / different logic
                print(f"No recent '{log_type}' log found for baby {baby_id}. Skipping reminder generation for this type.")


        # --- Save Reminders ---
        created_reminders = []
        if reminders_to_create:
            # Convert reminder_time to ISO format before inserting
            reminders_data = [
                {
                    **r.dict(),
                    "reminder_time": r.reminder_time.isoformat() if isinstance(r.reminder_time, datetime) else r.reminder_time,
                }
                for r in reminders_to_create
            ]
            try:
                result = self.supabase.table("reminders").insert(reminders_data).execute()
                created_reminders = result.data if result.data else []
                print(f"Successfully created {len(created_reminders)} reminders for baby {baby_id}.")
            except Exception as e:
                print(f"Error creating reminders for baby {baby_id}: {e}")

        return created_reminders

    def _check_existing_reminder(self, baby_id: str, reminder_type: str, expected_time: datetime, buffer: timedelta = timedelta(hours=1)) -> bool:
        """Checks if a non-completed reminder of the same type exists around the expected time."""
        try:
            time_lower_bound = expected_time - buffer
            time_upper_bound = expected_time + buffer

            result = self.supabase.table("reminders") \
                .select("id") \
                .eq("baby_id", baby_id) \
                .eq("reminder_type", reminder_type) \
                .eq("is_completed", False) \
                .gte("reminder_time", time_lower_bound.isoformat()) \
                .lte("reminder_time", time_upper_bound.isoformat()) \
                .limit(1) \
                .execute()
            return bool(result.data) # True if any reminder is found
        except Exception as e:
            print(f"Error checking existing reminders for baby {baby_id}, type {reminder_type}: {e}")
            return False # Assume no existing reminder on error to be safe


# Example Usage (Optional - for testing)
if __name__ == "__main__":
    # This requires SUPABASE_URL and SUPABASE_KEY in your .env file
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        print("Error: SUPABASE_URL and SUPABASE_KEY environment variables are required.")
    else:
        client: Client = create_client(supabase_url, supabase_key)
        agent = BabyAIAgent(client)

        # Replace with a real baby_id from your database for testing
        test_baby_id = "3296e4f0-d710-44e4-80bf-570493a64d27"
        now_utc = datetime.now(timezone.utc)

        print(f"\n--- Running Agent for Baby ID: {test_baby_id} ---")
        newly_created = agent.generate_reminders_from_baby_logs(test_baby_id, now_utc)
        print("\n--- Agent Run Complete ---")
        if newly_created:
            print("Created Reminders:")
            for reminder in newly_created:
                print(f"- {reminder.get('reminder_type')} at {reminder.get('reminder_time')} (ID: {reminder.get('id')})")
        else:
            print("No new reminders were created.")

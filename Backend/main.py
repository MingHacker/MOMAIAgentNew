import json
from typing import List, Dict
from fastapi.responses import JSONResponse
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
from typing import Optional, Literal
import os
from supabase import create_client, Client
from dotenv import load_dotenv
import jwt
from baby_ai_agent import BabyAIAgent
from contextlib import asynccontextmanager # For lifespan events
from apscheduler.schedulers.asyncio import AsyncIOScheduler # For background tasks
from apscheduler.triggers.interval import IntervalTrigger
from core.auth import get_current_user
#from agents.baby_manager import get_baby_health_today, call_gpt_baby_analysis
#from agents.mom_manager import get_mom_health_today, call_gpt_mom_analysis

from api.mom import router as mom_router
from api.task import router as task_router
from api.baby import router as baby_router
from api.emotion import router as emotion_router
from api.chat import router as chat_router

def serialize_datetime(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError ("Type not serializable")

load_dotenv()

# --- Global Variables (Initialized in Lifespan) ---
supabase: Client = None
agent: BabyAIAgent = None
scheduler: AsyncIOScheduler = None

# --- Lifespan Management (Define BEFORE app instantiation) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Supabase client, Agent, and Scheduler
    global supabase, agent, scheduler
    print("Starting up application...")
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    if not supabase_url or not supabase_key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables.")
    
    supabase = create_client(supabase_url, supabase_key)
    agent = BabyAIAgent(supabase)
    
    # Initialize and start the scheduler
    scheduler = AsyncIOScheduler(timezone="UTC") # Use UTC for consistency
    # Add the job to run reminder generation periodically (e.g., every hour)
    # Note: This runs for *all* babies. A more scalable approach might involve
    # triggering per baby based on activity or using a dedicated task queue.
    scheduler.add_job(
        run_reminder_generation_for_all_babies,
        trigger=IntervalTrigger(minutes=10), # Adjust interval as needed
        id="generate_all_reminders",
        replace_existing=True
    )
    scheduler.start()
    print("Scheduler started.")
    
    yield # Application runs here

    # Shutdown: Stop the scheduler
    print("Shutting down application...")
    if scheduler and scheduler.running:
        scheduler.shutdown()
        print("Scheduler shut down.")


app = FastAPI(
    title="BabyAgent API",
    description="API for baby tracking and health predictions",
    version="0.1.0",
    docs_url="/docs",
    lifespan=lifespan # Reference the lifespan manager defined above
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081", "http://10.0.0.23:8081","http://10.0.0.137:8081"],  # Allows specific origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

security = HTTPBearer()

# Supabase client setup
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# --- Models ---
class BabyLogCreate(BaseModel):
    baby_id: str
    log_type: Literal["feeding", "diaper", "sleep", "cry", "bowel", "outside"]
    log_data: dict
    logged_at: datetime
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ReminderCreate(BaseModel):
    baby_id: str
    reminder_type: Literal["feed", "diaper", "sleep"]
    reminder_time: datetime
    notes: Optional[str] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class BabyProfileCreate(BaseModel):
    name: str
    birth_date: datetime
    gender: Literal["male", "female", "other"]
    birth_weight: float
    birth_height: float

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class HealthPredictionCreate(BaseModel):
    baby_id: str
    prediction_type: str
    description: str
    recommended_action: dict

class CompleteReminderByLog(BaseModel):
    baby_id: str
    log_type: str


# --- Helper Functions ---
async def _verify_baby_ownership(baby_id: str, user_id: str):
    """Checks if the baby profile belongs to the authenticated user."""
    try:
        result = supabase.table("baby_profiles").select("id").eq("id", baby_id).eq("user_id", user_id).maybe_single().execute()
        if not result.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Baby profile not found or access denied.")
    except HTTPException as http_exc:
        raise http_exc # Re-raise specific HTTP exceptions
    except Exception as e:
        # Log the error e internally if needed
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error verifying baby ownership.")


# --- Baby Profile Endpoints ---
@app.post("/babies", status_code=status.HTTP_201_CREATED)
async def create_baby_profile(baby: BabyProfileCreate, user_id: str = Depends(get_current_user)):
    try:
        data = baby.dict(exclude_unset=True) # birth_date will now be automatically converted by Pydantic
        data["user_id"] = user_id
        # data["birth_date"] = data["birth_date"].isoformat() # Removed manual conversion
        result = supabase.table("baby_profiles").insert(data).execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/babies/{baby_id}")
async def get_baby_profile(baby_id: str, user_id: str = Depends(get_current_user)):
    try:
        result = supabase.table("baby_profiles").select("*").eq("id", baby_id).eq("user_id", user_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Baby not found")
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/babies")
async def get_all_babies(user_id: str = Depends(get_current_user)):
    try:
        result = supabase.table("baby_profiles").select("*").eq("user_id", user_id).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- Baby Log Endpoints ---
@app.post("/baby_logs", status_code=status.HTTP_201_CREATED)
async def create_baby_log(log: BabyLogCreate, user_id: str = Depends(get_current_user)):
    await _verify_baby_ownership(log.baby_id, user_id) # Verify ownership first
    try:
        data = jsonable_encoder(log)
        result = supabase.table("baby_logs").insert(data).execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/baby_logs")
async def get_baby_logs(
    baby_id: str,
    log_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    user_id: str = Depends(get_current_user)
):
    await _verify_baby_ownership(baby_id, user_id) # Verify ownership first
    try:
        # query = supabase.table("baby_logs").select("*").eq("baby_id", baby_id).eq("user_id", user_id) # Removed user_id filter
        query = supabase.table("baby_logs").select("*").eq("baby_id", baby_id)
        
        if log_type:
            query = query.eq("log_type", log_type)
        if start_date:
            query = query.gte("logged_at", start_date.isoformat())
        if end_date:
            query = query.lte("logged_at", end_date.isoformat())
            
        result = query.order("logged_at", desc=True).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- Reminder Endpoints --- 
@app.post("/reminders", status_code=status.HTTP_201_CREATED)
async def create_reminder(reminder: ReminderCreate, user_id: str = Depends(get_current_user)):
    await _verify_baby_ownership(reminder.baby_id, user_id) # Verify ownership first
    try:
        data = reminder.dict()
        # data.update({"user_id": user_id, "is_completed": False}) # Removed user_id insertion
        data.update({"is_completed": False})
        result = supabase.table("reminders").insert(data).execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.patch("/reminders/{reminder_id}", status_code=status.HTTP_200_OK)
async def update_reminder_status(reminder_id: str, user_id: str = Depends(get_current_user)):
    """Mark a reminder as completed after verifying baby ownership."""
    try:
        # 1. Fetch the reminder to get the baby_id
        reminder_data = supabase.table("reminders").select("id, baby_id").eq("id", reminder_id).maybe_single().execute()
        if not reminder_data.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found.")
            
        baby_id = reminder_data.data["baby_id"]

        # 2. Verify ownership of the associated baby
        await _verify_baby_ownership(baby_id, user_id)

        # 3. Update the reminder status (without user_id check here, as ownership is verified)
        result = supabase.table("reminders").update({"is_completed": True}).eq("id", reminder_id).execute()

        # Supabase update returns the updated rows. If empty, it might mean it was already complete.
        return result.data[0] if result.data else {"message": "Reminder status updated or was already complete."}
    except HTTPException as http_exc:
        raise http_exc # Re-raise specific HTTP exceptions
    except Exception as e:
        # Catch specific Supabase/DB errors if possible, otherwise generic error
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

def calculate_daily_summary(reminder, baby_id):
    """Calculate daily summary statistics for a given reminder."""
    try:
        reminder_date = datetime.fromisoformat(reminder['reminder_time']).date()
        start_date = datetime.combine(reminder_date, datetime.min.time())
        end_date = start_date + timedelta(days=1)
        
        # Get logs for this day
        logs = supabase.table("baby_logs").select("*").eq("baby_id", baby_id).eq("log_type", reminder.get('reminder_type')).gte("logged_at", start_date.isoformat()).lt("logged_at", end_date.isoformat()).execute().data
        
        # Calculate summary based on reminder type
        summary = {}
        if reminder['reminder_type'] == 'sleep':
            sleep_logs = [log for log in logs if log['log_type'] == 'sleep']
            total_mins = 0
            for log in sleep_logs:
                try:
                    start = datetime.strptime(log['log_data']['sleepStart'], "%H:%M")
                    end = datetime.strptime(log['log_data']['sleepEnd'], "%H:%M")
                    total_mins += (end - start).total_seconds() / 60
                except (KeyError, ValueError):
                    pass
            summary = {"totalmins": total_mins}
            
        elif reminder['reminder_type'] == 'diaper':
            diaper_logs = [log for log in logs if log['log_type'] == 'diaper']
            solid = sum(1 for log in diaper_logs if log['log_data'].get('diaperSolid', False))
            wet = sum(1 for log in diaper_logs if not log['log_data'].get('diaperSolid', True))
            summary = {"solid": solid, "wet": wet}
            
        elif reminder['reminder_type'] == 'feeding':
            feed_logs = [log for log in logs if log['log_type'] == 'feeding']
            total_ml = sum(int(log['log_data'].get('feedAmount', 0)) for log in feed_logs)
            summary = {"totalamountInML": total_ml}
    
        return json.dumps(summary, default=str)
    except Exception as e:
        print(f"Error generating summary for reminder {reminder.get('id')}: {str(e)}")
        return None

@app.get("/reminders")
async def get_reminders(
    baby_id: str, 
    upcoming: Optional[bool] = False, 
    user_id: str = Depends(get_current_user)
):
    """Fetch reminders with daily summary statistics"""
    await _verify_baby_ownership(baby_id, user_id)
    try:
        query = supabase.table("reminders").select("*").eq("baby_id", baby_id).eq("is_completed", False)
        
        if upcoming:
            query = query.gt("reminder_time", datetime.now().isoformat())
            
        result = query.order("reminder_time").execute()
        reminders = result.data
        reminders = get_latest_reminders(reminders)  # Get the latest reminders for each type
        # Add daily summary statistics
        for reminder in reminders:
            reminder['daily_summary'] = calculate_daily_summary(reminder, baby_id)

        return reminders
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

def get_latest_reminders(reminders: List[Dict]) -> List[Dict]:
    """
    Returns the most recent reminder for each reminder_type.

    Args:
        reminders: List of reminders, each with 'reminder_type' and 'reminder_time' (ISO string).

    Returns:
        List of reminders with the latest entry for each type.
    """
    latest = {}

    for r in reminders:
        r_type = r["reminder_type"]
        r_time = datetime.fromisoformat(r["reminder_time"])

        if r_type not in latest or r_time > datetime.fromisoformat(latest[r_type]["reminder_time"]):
            latest[r_type] = r

    return list(latest.values())

# --- Health Prediction Endpoints ---
@app.post("/health_predictions", status_code=status.HTTP_201_CREATED)
async def create_prediction(prediction: HealthPredictionCreate, user_id: str = Depends(get_current_user)):
    try:
        data = prediction.dict()
        data.update({"user_id": user_id, "predicted_on": datetime.now()})
        result = supabase.table("health_predictions").insert(data).execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/reminders/complete_by_log")
async def complete_reminder_by_log(reminderbylog:CompleteReminderByLog, user_id: str = Depends(get_current_user)):
    """Completes a reminder based on the baby_id and log_type."""
    await _verify_baby_ownership(reminderbylog.baby_id, user_id)
    try:
        # Map log_type to reminder_type
        reminder_type = reminderbylog.log_type

        # Find the first uncompleted reminder of the given type for the baby
        reminder_data = supabase.table("reminders").select("id").eq("baby_id", reminderbylog.baby_id).eq("reminder_type", reminder_type).eq("is_completed", False).limit(1).execute()

        if not reminder_data.data:
            return {"message": "No matching uncompleted reminder found."}
        
        reminder_id = reminder_data.data[0]["id"]

        # Mark the reminder as completed
        result = supabase.table("reminders").update({"is_completed": True}).eq("id", reminder_id).execute()

        # generate reminders for the baby
        generate_reminders_for_baby(reminderbylog.baby_id)

        if result.data:
            return {"message": f"Reminder with id {reminder_id} completed successfully."}
        else:
            return {"message": "Reminder status updated or was already complete."}

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@app.get("/health", include_in_schema=False)
async def health_check():
    """Endpoint for service health monitoring"""
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "version": "0.1.0"
    }

# --- Background Task Function ---
async def generate_reminders_for_baby(baby_id: str):
    """
    Generate reminders for a specific baby based on their logs.
    
    Args:
        baby_id: ID of the baby to generate reminders for
    """
    try:
        print(f"Processing reminders for baby: {baby_id}")
        agent.generate_reminders_from_baby_logs(baby_id, datetime.now(timezone.utc))
        return True
    except Exception as e:
        print(f"Error processing reminders for baby {baby_id}: {e}")
        return False

async def run_reminder_generation_for_all_babies():
    """
    Scheduled task to run reminder generation for all active baby profiles.
    """
    print(f"--- Running scheduled reminder generation at {datetime.now(timezone.utc)} ---")
    try:
        # Fetch all unique baby IDs (consider filtering for active babies if applicable)
        result = supabase.table("baby_profiles").select("id").execute()
        if not result.data:
            print("No baby profiles found to process.")
            return

        all_baby_ids = [baby['id'] for baby in result.data]
        print(f"Found {len(all_baby_ids)} babies to process.")

        processed_count = 0
        error_count = 0
        for baby_id in all_baby_ids:
            success = await generate_reminders_for_baby(baby_id)
            if success:
                processed_count += 1
            else:
                error_count += 1

        print(f"--- Scheduled reminder generation complete. Processed: {processed_count}, Errors: {error_count} ---")

    except Exception as e:
        print(f"Error fetching baby IDs for scheduled task: {e}")


# --- Agent backend ---

app.include_router(mom_router)
app.include_router(baby_router)
app.include_router(task_router)
app.include_router(emotion_router)
app.include_router(chat_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

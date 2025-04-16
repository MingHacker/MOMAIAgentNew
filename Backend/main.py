from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Literal
import os
from supabase import create_client, Client
from dotenv import load_dotenv
import jwt

load_dotenv()

app = FastAPI(
    title="BabyAgent API",
    description="API for baby tracking and health predictions",
    version="0.1.0",
    docs_url="/docs"
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
    log_type: Literal["feeding", "diaper", "sleep", "cry", "bowel"]
    log_data: dict
    logged_at: datetime = datetime.now()

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

# --- Authentication ---
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        decoded = jwt.decode(
            token,
            os.getenv("SUPABASE_KEY"),
            algorithms=["HS256"],
            audience="authenticated",
            issuer=f"{os.getenv('SUPABASE_URL')}/auth/v1",
            options={"verify_signature": False}
        )
        return decoded["sub"]
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

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
        data = log.dict()
        # data["user_id"] = user_id # Removed user_id insertion
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

@app.get("/reminders")
async def get_reminders(
    baby_id: str, 
    upcoming: Optional[bool] = False, 
    user_id: str = Depends(get_current_user)
):
    """Fetch reminders for a specific baby (owned by user), optionally filtering for upcoming reminders."""
    await _verify_baby_ownership(baby_id, user_id) # Verify ownership first
    try:
        # query = supabase.table("reminders").select("*").eq("baby_id", baby_id).eq("user_id", user_id) # Removed user_id filter
        query = supabase.table("reminders").select("*").eq("baby_id", baby_id)
        
        if upcoming:
            query = query.gt("reminder_time", datetime.now().isoformat())
            
        result = query.order("reminder_time").execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

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

@app.get("/health", include_in_schema=False)
async def health_check():
    """Endpoint for service health monitoring"""
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "version": "0.1.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

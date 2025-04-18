import os
from fastapi import APIRouter, Depends, HTTPException, status
from agents.babymanager.steps import analyze_with_gpt_step
from agents.babymanager.schema import BabyAgentState
from supabase import create_client, Client
from dotenv import load_dotenv
import jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(supabase_url, supabase_key)

router = APIRouter()

security = HTTPBearer()

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


@router.get("/dev/mock_analysis")
def get_mock_analysis(user_id: str = Depends(get_current_user)):
    mock_records = {
        "feed": [{"startTime": "08:00", "amount": 100}, {"startTime": "12:30", "amount": 90}],
        "sleep": [{"startTime": "10:00", "endTime": "11:00"}],
        "diaper": [{"time": "09:00", "type": "wet"}],
        "outside": [{"startTime": "14:00", "duration": 30}],
    }

    state = BabyAgentState(
        user_id=user_id,
        db=supabase,
        records=mock_records,
        analysis="",
        next_action=""
    )

    updated_state = analyze_with_gpt_step(state)

    return {
        "summary": updated_state.analysis,
        "next_action": updated_state.next_action
    }

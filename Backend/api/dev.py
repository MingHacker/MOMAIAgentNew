from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models.db import get_db
from agents.babymanager.steps import analyze_with_gpt_step
from agents.babymanager.schema import BabyAgentState

router = APIRouter()


@router.get("/dev/mock_analysis")
def get_mock_analysis(user_id: str = "demo_user", db: Session = Depends(get_db)):
    mock_records = {
        "feed": [{"startTime": "08:00", "amount": 100}, {"startTime": "12:30", "amount": 90}],
        "sleep": [{"startTime": "10:00", "endTime": "11:00"}],
        "diaper": [{"time": "09:00", "type": "wet"}],
        "outside": [{"startTime": "14:00", "duration": 30}],
    }

    state = BabyAgentState(
        user_id=user_id,
        db=db,
        records=mock_records,
        analysis="",
        next_action=""
    )

    updated_state = analyze_with_gpt_step(state)

    return {
        "summary": updated_state.analysis,
        "next_action": updated_state.next_action
    }

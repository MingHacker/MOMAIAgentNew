# ✅ agents/mom_manager/steps.py
from .schema import MomAgentState

def fetch_mom_health_data(state: MomAgentState) -> MomAgentState:
    # TODO: 实际应从 Apple HealthKit 获取数据，这里 mock
    return state.copy(update={
        "hrv": 34,
        "resting_hr": 72,
        "sleep": 6.8,
        "steps": 4100,
        "calories": 1650,
        "breathing_rate": 17,
    })

def analyze_mom_health_score(state: MomAgentState) -> MomAgentState:
    score = int((min(state.hrv, 50)/50)*30 + min(state.sleep, 8)/8*30 + min(state.steps, 6000)/6000*40)
    summary = "HRV 略低，注意多休息，睡眠还不错" if score < 75 else "状态良好，继续保持！"
    return state.copy(update={
        "summary": summary,
        "health_score": score
    })

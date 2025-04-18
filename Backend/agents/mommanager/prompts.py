# ✅ prompts/mom_prompt.py

def mom_health_prompt(hrv: int, sleep: float, steps: int) -> str:
    return f"""
You are a health assistant. The user is a mother who recently gave birth.

Based on her health data:
- HRV: {hrv}
- Sleep: {sleep} hours
- Steps: {steps}

Please provide:
1. A short analysis of her physical and emotional recovery status.
2. Gentle advice or encouragement, based on the data.
3. Mention if there's any warning or area to improve.

Respond in a warm, empathetic tone.
"""

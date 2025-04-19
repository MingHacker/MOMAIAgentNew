from openai import OpenAI
from jinja2 import Template
import json
import re
from .schema import EmotionAgentState
from .prompts import emotion_prompt_narrative as emotion_prompt, gentle_message_prompt_cn as gentle_message_prompt, celebration_prompt
from datetime import date, datetime
client = OpenAI()

def extract_json(text: str) -> dict:
    """从文本中提取 JSON 对象"""
    try:
        # 尝试直接解析
        return json.loads(text)
    except json.JSONDecodeError:
        # 如果失败，尝试提取 JSON 部分
        match = re.search(r'```json\s*({[\s\S]*?})\s*```', text)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass
    return {}

def replace_template_variables(text: str, data: dict) -> str:
    """替换文本中的模板变量"""
    for key, value in data.items():
        text = text.replace(f"{{{key}}}", str(value))
    return text

async def generate_emotion_analysis_step(state: EmotionAgentState) -> EmotionAgentState:
    mom = state.mom_data
    baby = state.baby_data

    # 准备模板数据
    template_data = {
        "hrv": mom.get("hrv", 0),
        "sleep_hours": mom.get("sleep_hours", 0),
        "resting_heart_rate": mom.get("resting_heart_rate", 0),
        "baby_sleep_hours": baby.get("sleep_total_hours", 0),
        "baby_cry_minutes": baby.get("cry_total_minutes", 0),
        "task_count": state.task_count or 0
    }

    prompt = Template(emotion_prompt).render(**template_data)

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a family emotion assistant."},
            {"role": "user", "content": prompt}
        ]
    )

    try:
        content = response.choices[0].message.content
        parsed = extract_json(content)
        state.summary = replace_template_variables(parsed.get("summary", ""), template_data)
        state.emotion_label = parsed.get("emotion_label", "uncertain")
        state.suggestions = parsed.get("suggestions", [])
    except Exception as e:
        state.summary = replace_template_variables(content, template_data)
        state.emotion_label = "uncertain"
        state.suggestions = []

    return state

async def generate_gentle_message_step(state: EmotionAgentState) -> EmotionAgentState:
    mom = state.mom_data
    baby = state.baby_data

    # 准备模板数据
    template_data = {
        "hrv": mom.get("hrv", 0),
        "sleep_hours": mom.get("sleep_hours", 0),
        "baby_sleep_hours": baby.get("sleep_total_hours", 0),
        "baby_cry_minutes": baby.get("cry_total_minutes", 0),
        "task_count": state.task_count or 0
    }

    prompt = Template(gentle_message_prompt).render(**template_data)

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}]
    )
    content = response.choices[0].message.content
    parsed = extract_json(content)
    state.gentle_message = replace_template_variables(parsed.get("message", content.strip()), template_data)
    return state

def get_baby_months_old(birthday: str) -> int:
    today = date.today()
    birth = datetime.fromisoformat(birthday).date()
    return (today.year - birth.year) * 12 + today.month - birth.month

async def check_celebration_step(state: EmotionAgentState) -> EmotionAgentState:
    baby_birthday = state.baby_data.get("birthday")
    baby_name = state.baby_data.get("name", "Your baby")

    if not baby_birthday:
        return state

    months_old = get_baby_months_old(baby_birthday)
    if date.today().day == datetime.fromisoformat(baby_birthday).day:
        state.celebration_text = f"{baby_name} turns {months_old} months today!"
    return state

async def generate_celebration_message_step(state: EmotionAgentState) -> EmotionAgentState:
    if not state.celebration_text:
        return state

    prompt = Template(celebration_prompt).render(
        occasion=state.celebration_text,
        baby_name=state.baby_data.get("name", "Your baby"),
        months_old=get_baby_months_old(state.baby_data["birthday"])
    )

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}]
    )

    state.gentle_message = response.choices[0].message.content.strip()
    return state
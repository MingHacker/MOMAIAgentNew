from .schema import BabyAgentState
from agents.baby_manager import get_today_records
from utils.gpt_calls import gpt_call
from utils.gpt_parse import parse_gpt_response
from agents.babymanager.prompts import baby_gpt_prompt
from typing import List

# ✅ 第一步：从数据库中获取今天所有记录

def fetch_records_step(state: BabyAgentState) -> BabyAgentState:
    data = get_today_records(state.user_id, state.db)
    return state.copy(update={
        "records": data,
        "analysis": ""  # 初始化为空字符串
    })

# ✅ 第二步：调用 GPT 分析宝宝的状态，并生成 summary 和 next_action

def analyze_with_gpt_step(state: BabyAgentState) -> BabyAgentState:
    data = state.records or {}
    prompt = baby_gpt_prompt(data)  # 从 prompts.py 引入模板

    response = gpt_call(prompt)
    parsed = parse_gpt_response(response)
    if not parsed:
        parsed = {
            "summary": response.strip(),
            "next_action": "Remember to keep tracking baby's activities."
        }

    return state.copy(update={
        "analysis": str(parsed.get("summary", "")),
        "next_action": str(parsed.get("next_action", "Don't forget to log your baby's activity."))
    })

# ✅ 第三步：检查记录是否缺失（如没有喂奶、没有睡觉等）

def check_missing_data_step(state: BabyAgentState) -> BabyAgentState:
    records = state.records
    missing = []

    if not records.get("feed"):
        missing.append("feed")
    if not records.get("sleep"):
        missing.append("sleep")
    if not records.get("diaper"):
        missing.append("diaper")
    if not records.get("outside"):
        missing.append("outside")

    return state.copy(update={
        "missing_fields": missing
    })

# ✅ 第四步：根据缺失字段计算健康分数

def determine_health_score_step(state: BabyAgentState) -> BabyAgentState:
    score = 100
    for field in state.missing_fields:
        score -= 20  # 每缺少一项，减 20 分

    return state.copy(update={
        "health_score": score
    })

# ✅ 第五步：如果健康，生成正向总结

def generate_positive_summary_step(state: BabyAgentState) -> BabyAgentState:
    return state.copy(update={
        "analysis": state.analysis + " 💚 宝宝今天状态良好，无异常记录。"
    })

# ✅ 第六步：如果不健康，提醒妈妈注意

def alert_mom_step(state: BabyAgentState) -> BabyAgentState:
    alert_text = "⚠️ 注意：记录数据中有缺失项：" + ", ".join(state.missing_fields)
    return state.copy(update={
        "analysis": state.analysis + " " + alert_text
    })

# ✅ 第七步：生成提示建议，作为结尾

def generate_tips_step(state: BabyAgentState) -> BabyAgentState:
    tip = "记得明天也要持续记录宝宝的活动哦 😊"
    return state.copy(update={
        "next_action": tip
    })

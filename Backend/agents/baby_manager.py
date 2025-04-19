# 🍼 baby_manager.py

from http import client
from agents.babymanager.prompts import baby_gpt_prompt
from openai import OpenAI
from pydantic import BaseModel
from datetime import date
from typing import Dict
from supabase import Client
import json
import re


client = OpenAI()

class BabyAnalysisResponse(BaseModel):
    summary: str
    next_action: str

type_mapping = {
    "feeding": "feed",
    "sleep": "sleep",
    "diaper": "diaper",
    "cry": "cry",
    "bowel": "bowel",
    "outside": "outside"
}

def extract_json(text):
    try:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
    except Exception as e:
        print("⚠️ JSON 提取失败:", e)
    return {"summary": text.strip(), "next_action": ""}

def get_baby_health_today(baby_id: str, supabase: Client) -> Dict:
    today_str = date.today().isoformat()

    logs_result = (
        supabase
        .table("baby_logs")
        .select("log_type, log_data, logged_at")
        .eq("baby_id", baby_id)
        .gte("logged_at", today_str)
        .execute()
    )

    print("🧾 原始 logs_result:", logs_result.data)

    logs = {
        "feed": [],
        "sleep": [],
        "diaper": [],
        "cry": [],
        "bowel": [],
        "outside": []
    }

    type_mapping = {
        "feeding": "feed",
        "sleep": "sleep",
        "diaper": "diaper",
        "cry": "cry",
        "bowel": "bowel",
        "outside": "outside"
    }

    for row in logs_result.data:
        log_type = row.get("log_type")
        log_data = row.get("log_data")

        if not log_type or not log_data:
            continue  # 跳过无效数据

        mapped_key = type_mapping.get(log_type)
        if mapped_key:
            logs[mapped_key].append(log_data)
        else:
            print(f"⚠️ 未知类型 {log_type}，跳过")

    print(f"✅ 解析完成 baby 健康数据: {logs}")
    return logs


# ✨ GPT 分析函数（调用分析 Agent）
def call_gpt_baby_analysis(baby_id: str, supabase: Client) -> Dict:
    data = get_baby_health_today(baby_id, supabase)
    prompt = baby_gpt_prompt(data)

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a baby care assistant AI."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
        )
        content = response.choices[0].message.content
        
        parsed = extract_json(content)

        return {
            "summary": parsed.get("summary", ""),
            "next_action": parsed.get("next_action", "")
        }
    except Exception as e:
        print("❌ GPT 返回异常:", e)
        return {
            "summary": str(e),
            "next_action": ""
        }

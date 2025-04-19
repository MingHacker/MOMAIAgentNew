from openai import OpenAI
from dotenv import load_dotenv
import os
from agents.mommanager.prompts import mom_health_prompt


load_dotenv()
client = OpenAI(api_key=os.getenv("DEEPSEEK_API_KEY"))

def get_mom_health_today() -> dict:
    """
    获取妈妈今天的健康数据（模拟数据）
    """
    return {
        "hrv": 34,
        "sleep": 7.5,
        "steps": 5000,
        "mood": "calm"
    }

def call_gpt_mom_analysis(data: dict) -> str:
    """
    用于 GPT 分析妈妈健康状况，返回 summary 文本（用于 /api/mom/summary）
    """
    prompt = mom_health_prompt(data["hrv"], data["sleep"], data["steps"])
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content
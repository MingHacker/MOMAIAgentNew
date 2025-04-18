from datetime import datetime

# ✅ 文字分析版本 Prompt（适合非结构化 GPT 输出）
def baby_analysis_prompt(records: str) -> str:
    return f"""Today is {datetime.now().strftime('%Y-%m-%d')}.
Here is the baby's daily activity:

{records}

Please analyze today's status and provide:
- Feed summary and next suggestion
- Sleep quality and next nap time
- Diaper and outdoor summary
"""

# ✅ 结构化 JSON 格式 Prompt（适合 parse_gpt_response 使用）
def baby_gpt_prompt(data: dict) -> str:
    return f"""
You're a pediatric assistant. Given the baby's records:

Feedings: {data.get('feed', [])}
Sleeps: {data.get('sleep', [])}
Diapers: {data.get('diaper', [])}
Outside time: {data.get('outside', [])}

1. Summarize today's baby condition.
2. Recommend the next action (soft reminder style to mom).

Respond in JSON format:
{{
  "summary": "...",
  "next_action": "..."
}}
"""

# ✅ 可扩展：分析宝宝 tips（未来扩展用）
def baby_tips_prompt(data: dict) -> str:
    return f"""
Based on baby's records today:
Feed: {data.get('feed', [])}
Sleep: {data.get('sleep', [])}
Suggest one soft tip for mom to improve baby's care.
"""

def baby_summary_prompt(feed, sleep, diaper, outside) -> str:
    return f"""
    你是一个关于宝宝健康的分析AI。以下是信息：
    - 喂养记录：{feed}
    - 睡眠记录：{sleep}
    - 尿布记录：{diaper}
    - 户外时间：{outside} 分钟

    根据以上信息，给出总结并提出下一步行动建议。

    格式：先给出总结 (Summary)，然后 "Next Action:" 后给出建议。
    """
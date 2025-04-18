def build_task_prompt(
    input_text: str,
    mom_health_status: dict,
    baby_health_status: dict
) -> str:
    """
    构建完整的 Prompt 给 GPT，让它输出一个包含 tasks 的 JSON 对象。

    :param input_text:   妈妈输入的自然语言任务需求 (如: "明天早上带宝宝去打疫苗, 并采购一些婴儿用品")
    :param mom_health_status:   妈妈的健康/情绪/状态信息，如 {"energy_level": "low", "mood": "tired"}
    :param baby_health_status:  宝宝的健康/生长状况信息，如 {"age_in_months": 6, "recent_vaccines": ["BCG", "HepB"]}
    :return: 拼接完成后的 Prompt 字符串
    """

    PROMPT_TEMPLATE = """
你是一位智能的妈妈生活助理。请根据以下信息，为妈妈生成 1–4 条待办任务，并**只用纯 JSON** 输出。

【妈妈健康状态】
{mom_health_status}

【宝宝健康状态】
{baby_health_status}

【妈妈的自然语言输入】
“{input_text}”

【输出格式要求】
1. 仅返回一个 JSON 对象，顶层字段必须是 "tasks"。
2. "tasks" 的值为数组，数组元素为对象，**仅含一个字段 "title"**，其值为任务标题字符串。
3. 任务数量 1–4 条，根据输入内容和健康状态自行推断并按重要性排序。
4. 不要输出除 JSON 之外的任何文字、解释或注释。

**示例**  
{{
  "tasks": [
    {{"title": "准备宝宝的奶瓶"}},
    {{"title": "准备宝宝尿不湿"}}
  ]
}}
"""
 

    # 将状态信息转成字符串，确保可以安全 format
    mom_status_str = str(mom_health_status) if mom_health_status else "{}"
    baby_status_str = str(baby_health_status) if baby_health_status else "{}"

    # 拼接最终 Prompt
    final_prompt = PROMPT_TEMPLATE.format(
        input_text=input_text,
        mom_health_status=mom_status_str,
        baby_health_status=baby_status_str
    )

    return final_prompt
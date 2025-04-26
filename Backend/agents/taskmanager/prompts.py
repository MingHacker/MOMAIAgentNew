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
你是一位智能的妈妈生活助理。请根据以下信息，为妈妈生成 2–4 条待办任务， 比如说妈妈今天要看医生，那么就返回看医生相关的任务，example: 带healthcare card， bring diaper， fasting etc.
列入妈妈要去购物，输出的任务example：buy baby food, diapers, wipes. bring diaper etc.
并**只用纯 JSON** 输出。
然后再把主任务归类成Family, Health, Baby, Other 的其中一个类型，返回一个 JSON 对象，顶层字段必须是 "category"。

【Main task】
“{input_text}”

【Mom health status】, if there is no useful information, do not consider it
{mom_health_status}

【Baby health status】, if there is no useful information, do not consider it
{baby_health_status}



【输出格式要求】
1. only return one JSON object, the top level field must be "tasks". return in english.
2. the value of 'tasks' must be an arrawy, and each array element must be an object containing only one field 'title'.
3. the number of tasks is 1–4, and should be sorted by importance based on the input content and health status.
4. do not return any text, explanation or annotation except for the JSON.
5. if the mom is going to shop, then return shopping related tasks, example: buy baby food, diapers, wipes. bring diaper etc.
**Example**  
input：going outisde with the baby，返回下面任务：
{{
  "category": "Family",
  "tasks": [
    {{"title": "Bring water bottle"}},
    {{"title": "Bring diaper"}},
    {{"title": "Bring wipes"}},
    {{"title": "Bring baby food"}}
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
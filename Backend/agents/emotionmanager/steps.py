# -------- steps.py --------

from langchain.chat_models import ChatOpenAI
from jinja2 import Template
from .prompts import HEADER_PROMPT
from .schema import Metrics, CompanionHeader

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)


async def generate_header_step(state: Metrics) -> CompanionHeader:  # LangGraph node
    prompt = Template(HEADER_PROMPT).render(**state)
    response = await llm.ainvoke(prompt)
    return {"headerText": response.content.strip()}

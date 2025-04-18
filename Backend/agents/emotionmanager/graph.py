# -------- graph.py --------
from langgraph.graph import StateGraph
from agents.emotionmanager.schema import Metrics, CompanionHeader
from agents.emotionmanager.steps import generate_header_step


def _build_graph():
    builder = StateGraph()                             # ✅ 不带参数
    builder.add_node("generate_header", generate_header_step)
    builder.set_entry_point("generate_header")
    builder.set_finish_point("generate_header")
    # 把输入输出类型放到 compile() 里
    return builder.compile(input_type=Metrics, output_type=CompanionHeader)


_companion_graph = _build_graph()


async def run_companion_graph(metrics: Metrics) -> CompanionHeader:
    return await _companion_graph.ainvoke(metrics)
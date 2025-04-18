# -------- graph.py --------
from langgraph.graph import StateGraph
from agents.emotionmanager.schema import Metrics, CompanionHeader
from agents.emotionmanager.steps import generate_header_step


def _build_graph():
    builder = StateGraph(Metrics)                             # 添加状态模式
    builder.add_node("generate_header", generate_header_step)
    builder.set_entry_point("generate_header")
    builder.set_finish_point("generate_header")
    return builder.compile()  # 移除 input_type 和 output_type 参数


_companion_graph = _build_graph()


async def run_companion_graph(metrics: Metrics) -> CompanionHeader:
    return await _companion_graph.ainvoke(metrics)
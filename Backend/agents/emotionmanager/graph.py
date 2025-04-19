from langgraph.graph import StateGraph, END
from .schema import EmotionAgentState
from .steps import generate_emotion_analysis_step, generate_gentle_message_step, generate_celebration_message_step, check_celebration_step

def build_emotion_graph():
    graph = StateGraph(EmotionAgentState)

    # 🎯 1. 添加所有步骤节点
    graph.add_node("analyze_emotion", generate_emotion_analysis_step)
    graph.add_node("generate_message", generate_gentle_message_step)
    graph.add_node("check_celebration", check_celebration_step)
    graph.add_node("generate_celebration", generate_celebration_message_step)

    # 🚪 2. 设置起点（入口）
    graph.set_entry_point("analyze_emotion")

    # 🔗 3. 构建主流程链路
    graph.add_edge("analyze_emotion", "generate_message")
    graph.add_edge("generate_message", "check_celebration")
    graph.add_edge("check_celebration", "generate_celebration")
    graph.add_edge("generate_celebration", END)

    # ✅ 4. 编译 Graph
    compiled = graph.compile()
    compiled.get_output_type = lambda: EmotionAgentState
    compiled.get_output_type.__annotations__ = {"return": EmotionAgentState}

    return compiled

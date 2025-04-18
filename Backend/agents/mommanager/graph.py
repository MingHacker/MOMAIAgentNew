# ✅ agents/mom_manager/graph.py
from langgraph.graph import StateGraph, END
from .schema import MomAgentState
from .steps import fetch_mom_health_data, analyze_mom_health_score

def build_mom_manager_graph():
    graph = StateGraph(MomAgentState)

    graph.add_node("fetch_health", fetch_mom_health_data)
    graph.add_node("analyze_score", analyze_mom_health_score)

    graph.set_entry_point("fetch_health")
    graph.add_edge("fetch_health", "analyze_score")
    graph.add_edge("analyze_score", END)

    compiled = graph.compile()
    compiled.get_output_type = lambda: MomAgentState
    return compiled

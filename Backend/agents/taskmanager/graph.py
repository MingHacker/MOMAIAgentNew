from langgraph.graph import StateGraph, END
from .steps import task_manager_node
from typing import Dict, Any
from .schema import TaskManagerInput, TaskManagerOutput

# 使用通用 dict 作为状态类型，让节点返回任意字典都会被采纳
builder = StateGraph(Dict[str, Any])

# 任务节点处理函数，将输入字典转成 TaskManagerInput，调用核心逻辑，返回 TaskManagerOutput
def task_node_step(state: Dict[str, Any]) -> TaskManagerOutput:
    """
    state: 包含 user_id, input_text, mom_health_status, baby_health_status
    """
    # 转成 TypedDict 调用核心步骤
    ti = TaskManagerInput(
        user_id=state["user_id"],
        input_text=state["input_text"],
        mom_health_status=state.get("mom_health_status", {}),
        baby_health_status=state.get("baby_health_status", {}),
    )
    # 直接返回解析后的 TaskManagerOutput
    return task_manager_node(ti)

# 构建流程图
builder.add_node("task_node", task_node_step)
builder.set_entry_point("task_node")
builder.add_edge("task_node", END)

task_graph = builder.compile()
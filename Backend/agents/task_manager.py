from typing import Dict, Any
from .taskmanager.schema import TaskManagerInput
from .taskmanager.graph import task_graph
from .taskmanager.steps import task_manager_node

def run_task_manager(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    直接将输入字典传给流程图，获取 TaskManagerOutput
    """
    graph_output = task_graph.invoke(input_data)
    return {
        "task_output": graph_output,
        "status": "success"
    }


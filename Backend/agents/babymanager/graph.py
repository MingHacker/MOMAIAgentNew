# 导入必要的库和模块
from langgraph.graph import StateGraph, END
from agents.babymanager.schema import BabyAgentState
from agents.babymanager.steps import (
    fetch_records_step,          # 获取记录步骤
    analyze_with_gpt_step,       # GPT分析步骤
    check_missing_data_step,     # 检查缺失数据步骤
    determine_health_score_step, # 确定健康分数步骤
    generate_tips_step,         # 生成建议步骤
    alert_mom_step,             # 提醒妈妈步骤
    generate_positive_summary_step  # 生成积极总结步骤
)

# 健康状况判断函数
def health_condition_function(state: BabyAgentState):
    """
    根据健康分数判断宝宝状态
    :param state: 宝宝状态对象
    :return: 返回"healthy"或"unhealthy"
    """
    if state.health_score >= 80:
        return "healthy"     # 健康状态
    else:
        return "unhealthy"   # 需要关注状态


def build_baby_manager_graph():
    """
    构建宝宝管理流程图
    :return: 编译后的流程图
    """
    # 初始化状态图，使用BabyAgentState作为状态管理
    graph = StateGraph(BabyAgentState)

    # 添加各个处理节点
    graph.add_node("fetch_records", fetch_records_step)          # 获取宝宝的各项记录
    graph.add_node("check_missing", check_missing_data_step)     # 检查是否有缺失的重要数据
    graph.add_node("analyze", analyze_with_gpt_step)            # 使用GPT分析数据
    graph.add_node("score_health", determine_health_score_step)  # 计算健康评分
    graph.add_node("generate_tips", generate_tips_step)         # 生成照护建议
    graph.add_node("alert_mom", alert_mom_step)                 # 需要时提醒妈妈
    graph.add_node("generate_positive_summary", generate_positive_summary_step)  # 生成积极的总结报告

    # 设置流程图的入口点
    graph.set_entry_point("fetch_records")

    # 设置正常处理流程的边
    graph.add_edge("fetch_records", "check_missing")   # 获取记录后检查数据完整性
    graph.add_edge("check_missing", "analyze")         # 数据完整后进行分析
    graph.add_edge("analyze", "score_health")          # 分析后评估健康状况

    # 根据健康状况添加条件分支
    graph.add_conditional_edges("score_health", health_condition_function, {
        "healthy": "generate_positive_summary",    # 健康状况良好时，生成积极总结
        "unhealthy": "alert_mom"                  # 健康状况需注意时，提醒妈妈
    })

    # 设置最终流程
    graph.add_edge("generate_positive_summary", "generate_tips")  # 生成总结后给出建议
    graph.add_edge("alert_mom", "generate_tips")                 # 提醒后给出建议
    graph.add_edge("generate_tips", END)                        # 流程结束

    # 编译流程图
    compiled = graph.compile()
    compiled.get_output_type = lambda: BabyAgentState  # ✅ 必须加这行
    return compiled
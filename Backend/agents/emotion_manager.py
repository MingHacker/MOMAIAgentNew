from .emotionmanager.schema import EmotionAgentState
from .emotionmanager.graph import build_emotion_graph

async def run_emotion_analysis(user_id: str, baby_id: str, mom_data: dict, baby_data: dict):
    graph = build_emotion_graph()
    state = EmotionAgentState(
        user_id=user_id,
        baby_id=baby_id,
        mom_data=mom_data,
        baby_data=baby_data
    )
    result = await graph.ainvoke(state)
    return result

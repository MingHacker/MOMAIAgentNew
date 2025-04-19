from typing import Optional, Dict, Any, List
import json
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv
import os
from datetime import datetime, timedelta
from baby_ai_agent import call_deepseek_api
from baby_health_agent.prompts import DEFAULT_PROMPT
from baby_health_agent.utils import format_baby_logs
import langgraph
from langgraph.graph import StateGraph, END

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(supabase_url, supabase_key)

# Define the state for the LangGraph agent
class BabyHealthAgentState(BaseModel):
    user_id: str
    baby_id: str
    analysis: str = ""
    next_action: str = ""
    baby_logs: Optional[List[Dict[str, Any]]] = None  
    prompt: Optional[str] = None                      
    llm_response: Optional[str] = None                

# Define the function to fetch baby logs from Supabase
def fetch_baby_logs(state: BabyHealthAgentState) -> BabyHealthAgentState:
    today = datetime.now()
    start_date = today - timedelta(days=7)  # Fetch logs for the last 7 days
    end_date = today
    response = supabase.table("baby_logs").select("*").eq("baby_id", state.baby_id).gte("logged_at", start_date.isoformat()).lte("logged_at", end_date.isoformat()).execute()
    state.baby_logs = response.data
    return state

# Define the function to generate prompts for the LLM
def generate_prompts(state: BabyHealthAgentState) -> BabyHealthAgentState:
    formatted_logs = format_baby_logs(state.baby_logs)
    state.prompt = DEFAULT_PROMPT.format(baby_logs=formatted_logs)
    return state

def call_llm(state: BabyHealthAgentState) -> BabyHealthAgentState:
    # Get structured response from LLM
    structured_prompt = f"""{state.prompt}
    
    Respond in JSON format with these keys:
    - overall_status: string (healthy/needs_attention/warning)
    - summary: string (3-5 sentence summary)
    - indicators: object (key-value pairs of metrics)
    - recommendations: array of strings (actionable items)"""
    
    state.llm_response = call_deepseek_api(structured_prompt)
    return state

def parse_llm_response(state: BabyHealthAgentState) -> BabyHealthAgentState:
    try:
        llm_response = state.llm_response
        if llm_response.startswith("```json"):
            llm_response = llm_response.strip("`").lstrip("json").strip()
        clean_str = llm_response.encode().decode("unicode_escape")
        response_data = json.loads(clean_str)
        state.analysis = response_data.get("summary", "No summary provided")
        state.next_action = ", ".join(response_data.get("recommendations", []))
        # Maintain full structured response
        state.llm_response = response_data
    except json.JSONDecodeError:
        state.analysis = "Error parsing LLM response"
        state.next_action = "Check API connection"
    return state

# Define the LangGraph graph
def create_baby_health_graph():
    graph = StateGraph(BabyHealthAgentState)

    graph.add_node("fetch_baby_logs", fetch_baby_logs)
    graph.add_node("generate_prompts", generate_prompts)
    graph.add_node("call_llm", call_llm)
    graph.add_node("parse_llm_response", parse_llm_response)

    graph.set_entry_point("fetch_baby_logs")

    graph.add_edge("fetch_baby_logs", "generate_prompts")
    graph.add_edge("generate_prompts", "call_llm")
    graph.add_edge("call_llm", "parse_llm_response")
    graph.add_edge("parse_llm_response", END)

    return graph.compile()

baby_health_graph = create_baby_health_graph()

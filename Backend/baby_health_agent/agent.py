from typing import Optional, Dict, Any, List
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

# Define the function to fetch baby logs from Supabase
def fetch_baby_logs(state: BabyHealthAgentState) -> Dict:
    today = datetime.now()
    start_date = today - timedelta(days=7)  # Fetch logs for the last 7 days
    end_date = today
    response = supabase.table("baby_logs").select("*").eq("baby_id", state.baby_id).gte("logged_at", start_date.isoformat()).lte("logged_at", end_date.isoformat()).execute()
    return {"baby_logs": response.data, "state": state}

# Define the function to generate prompts for the LLM
def generate_prompts(data: Dict) -> Dict:
    baby_logs = data["baby_logs"]
    state = data["state"]
    formatted_logs = format_baby_logs(baby_logs)
    prompt = DEFAULT_PROMPT.format(baby_logs=formatted_logs)
    return {"prompt": prompt, "state": state}

# Define the function to call the LLM (using baby_ai_agent)
def call_llm(data: Dict) -> Dict:
    prompt = data["prompt"]
    state = data["state"]
    llm_response = call_deepseek_api(prompt)
    return {"llm_response": llm_response, "state": state}

# Define the function to parse the LLM response
def parse_llm_response(data: Dict) -> Dict:
    llm_response = data["llm_response"]
    state = data["state"]
    # Implement your LLM response parsing logic here
    # This is just a placeholder
    state.analysis = llm_response
    state.next_action = "No action needed"
    return {"state": state}

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

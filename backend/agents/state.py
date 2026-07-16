from typing import TypedDict, List, Dict, Any, Optional
from datetime import datetime


class AgentState(TypedDict, total=False):
    """State passed between agents in the graph.

    IMPORTANT: In LangGraph, every key a node writes to `state[...]` MUST
    be declared here. If a key is missing from this schema, LangGraph will
    silently drop it when merging state between nodes — this was the cause
    of the infinite loop (agent_executed was never declared, so it never
    persisted between supervisor_router calls).
    """

    # User input
    query: str
    user_id: int
    thread_id: str

    # Agent routing
    current_agent: str
    next_agent: str
    agent_executed: bool     # tracks whether an agent already ran this turn
    last_agent: str          # which agent last produced a response
    _loop_count: int         # safety-net counter to hard-cap routing iterations

    # Product data
    products: List[Dict[str, Any]]
    selected_product: Optional[Dict[str, Any]]
    preferences: Dict[str, Any]

    # Inventory data
    stock_check: Dict[str, Any]
    product_id: int

    # Payment data
    payment_result: Dict[str, Any]
    amount: float

    # Order data
    order_id: Optional[int]
    order_status: Optional[str]

    # Support data
    support_response: Dict[str, Any]

    # Final output
    response: str
    error: Optional[str]

    # Metadata
    messages: List[Dict[str, str]]
    timestamp: datetime
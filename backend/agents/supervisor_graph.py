from typing import Dict, Any, List, Literal, Optional
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import create_react_agent
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from .llm_router import get_llm
import os
import json
import re
import warnings
from datetime import datetime, timezone
from .llm_utils import get_llm
warnings.filterwarnings("ignore")

# Import all agents
from .state import AgentState
from .recommendation_graph import RecommendationGraph
from .inventory_graph import InventoryGraph
from .payment_graph import PaymentGraph
from .support_graph import SupportGraph

# Import database models for checkpointing
try:
    from backend.database.models import SessionLocal, Checkpoint, Conversation
except ImportError:
    import sys
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'database'))
    from models import SessionLocal, Checkpoint, Conversation

# Try to import PostgresSaver
try:
    from langgraph.checkpoint.postgres import PostgresSaver
    POSTGRES_AVAILABLE = True
except ImportError:
    print("⚠️ PostgresSaver not available. Checkpointing disabled.")
    POSTGRES_AVAILABLE = False


MAX_LOOP_ITERATIONS = 5  # hard safety cap so a routing bug can never spin forever


class SupervisorGraph:
    """Supervisor Agent that orchestrates all specialized agents"""

    def __init__(self, use_checkpointing: bool = True):
        # Initialize LLM for decision making
        self.llm = get_llm()

        # Initialize all specialized agents
        self.recommendation_agent = RecommendationGraph()
        self.inventory_agent = InventoryGraph()
        self.payment_agent = PaymentGraph()
        self.support_agent = SupportGraph()

        # Build the supervisor graph
        self.graph = self._build_graph()

        # Setup checkpointing
        self.use_checkpointing = use_checkpointing and POSTGRES_AVAILABLE
        if self.use_checkpointing:
            self._setup_checkpointing()
        else:
            print("ℹ️ Checkpointing disabled (PostgresSaver not available)")

    def _setup_checkpointing(self):
        """Setup PostgreSQL checkpointing"""
        try:
            from langgraph.checkpoint.postgres import PostgresSaver
            self.checkpointer = PostgresSaver.from_conn_string(os.getenv("DATABASE_URL"))
            self.graph = self.graph.compile(checkpointer=self.checkpointer)
            print("✅ PostgreSQL checkpointing enabled")
        except Exception as e:
            print(f"⚠️ Checkpointing not available: {e}")
            self.use_checkpointing = False

    def _build_graph(self):
        """Build the LangGraph workflow with supervisor"""
        graph = StateGraph(AgentState)

        # Add nodes
        graph.add_node("supervisor_router", self.supervisor_router)
        graph.add_node("recommendation_node", self.recommendation_node)
        graph.add_node("inventory_node", self.inventory_node)
        graph.add_node("payment_node", self.payment_node)
        graph.add_node("support_node", self.support_node)
        graph.add_node("final_response", self.final_response)
        graph.add_node("handle_error", self.handle_error)

        # Set entry point
        graph.set_entry_point("supervisor_router")

        # Add conditional edges from supervisor
        graph.add_conditional_edges(
            "supervisor_router",
            self.route_decision,
            {
                "recommendation": "recommendation_node",
                "inventory": "inventory_node",
                "payment": "payment_node",
                "support": "support_node",
                "final": "final_response",
                "error": "handle_error"
            }
        )

        # Add edges back to supervisor after each agent
        graph.add_edge("recommendation_node", "supervisor_router")
        graph.add_edge("inventory_node", "supervisor_router")
        graph.add_edge("payment_node", "supervisor_router")
        graph.add_edge("support_node", "supervisor_router")

        # Final edge
        graph.add_edge("final_response", END)
        graph.add_edge("handle_error", END)

        return graph.compile()

    def supervisor_router(self, state: AgentState) -> AgentState:
        """Analyze user query and decide which agent to use"""
        try:
            query = state.get("query", "").lower().strip()
            last_agent = state.get("last_agent", "")
            
            # Check if it's a confirmation after inventory check
            if query in ["yes", "sure", "ok", "okay", "yep", "yeah"]:
                if last_agent == "inventory":
                    print("🛒 User confirmed purchase. Routing to payment.")
                    state["current_agent"] = "payment"
                    state["query"] = "Process payment for the product I just checked"
                    state["agent_executed"] = False
                    return state
                
                if last_agent == "recommendation":
                    print("🛍️ User wants more details. Routing to recommendation again.")
                    state["current_agent"] = "recommendation"
                    state["query"] = "Show me more details"
                    state["preferences"] = {"use_last_results": True}
                    state["agent_executed"] = False
                    return state
            
            # Check if we already have a response (agent executed)
            if state.get("agent_executed", False):
                print("✅ Agent already executed. Going to final response.")
                state["current_agent"] = "final"
                return state
            
            history = state.get("messages", [])
            user_id = state.get("user_id", 1)
            previous_response = state.get("response", "")
            
            # Save conversation to database
            self._save_conversation(user_id, query, "supervisor", "processing")
            
            # Check if the query is a greeting or general question (not related to shopping)
            greetings = ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"]
            general_questions = ["how are you", "what's up", "how's it going", "what is the weather", "weather", "time", "date"]
            farewells = ["bye", "goodbye", "see you", "thanks", "thank you"]
            
            # If it's a greeting or general question, go to final
            if any(g in query for g in greetings) or any(g in query for g in general_questions):
                print("💬 Detected greeting or general question. Routing to final.")
                state["current_agent"] = "final"
                return state
            
            # Analyze intent with LLM for shopping-related queries
            prompt = f"""
            You are a Supervisor Agent managing a team of AI agents.
            
            Analyze the user's query and decide which agent should handle it.
            
            Available Agents:
            1. recommendation - For product searches, recommendations, browsing
            2. inventory - For checking stock, availability
            3. payment - For processing payments, refunds
            4. support - For tracking orders, returns, customer service
            5. final - If the conversation is complete or it's a greeting
            
            User Query: {query}
            
            Previous agent response: {previous_response[:200] if previous_response else 'None'}
            Last agent used: {last_agent}
            
            Return ONLY the agent name (recommendation, inventory, payment, support, or final).
            
            Rules:
            - If user is asking about products, use recommendation
            - If user is asking about stock/availability, use inventory
            - If user is asking about payment/checkout, use payment
            - If user is asking about orders/returns/support, use support
            - If the query is a greeting, thank you, or the task is complete, use final
            """
            
            response = self.llm.invoke([HumanMessage(content=prompt)])
            agent_choice = response.content.strip().lower()
            
            # Validate the choice
            valid_agents = ["recommendation", "inventory", "payment", "support", "final"]
            
            # Extract agent name using regex
            for agent in valid_agents:
                if agent in agent_choice:
                    state["current_agent"] = agent
                    break
            else:
                state["current_agent"] = "final"
            
            print(f"🔀 Supervisor routing to: {state['current_agent']}")
            
            # Update conversation with agent selection
            self._save_conversation(user_id, query, state['current_agent'], "routed")
            
            return state
            
        except Exception as e:
            state["error"] = f"Supervisor routing failed: {str(e)}"
            state["current_agent"] = "error"
            return state

    def route_decision(self, state: AgentState) -> str:
        """Return the next node based on supervisor decision"""
        # If agent already executed, go to final
        if state.get("agent_executed", False):
            return "final"

        agent = state.get("current_agent", "final")

        if agent == "recommendation":
            return "recommendation"
        elif agent == "inventory":
            return "inventory"
        elif agent == "payment":
            return "payment"
        elif agent == "support":
            return "support"
        elif agent == "error":
            return "error"
        else:
            return "final"

    def recommendation_node(self, state: AgentState) -> AgentState:
        """Execute Recommendation Agent"""
        try:
            query = state.get("query", "")
            preferences = state.get("preferences", {})

            result = self.recommendation_agent.process(query, preferences=preferences)

            state["response"] = result.get("response", "")
            state["products"] = result.get("products", [])
            state["error"] = result.get("error")
            state["last_agent"] = "recommendation"
            state["agent_executed"] = True

            self._save_conversation(
                state.get("user_id", 1), query, "recommendation", "completed", state["response"]
            )
            return state
        except Exception as e:
            state["error"] = f"Recommendation agent failed: {str(e)}"
            state["agent_executed"] = True
            return state

    def inventory_node(self, state: AgentState) -> AgentState:
        """Execute Inventory Agent"""
        try:
            query = state.get("query", "")
            result = self.inventory_agent.process(query)

            state["response"] = result.get("response", "")
            state["stock_check"] = result.get("stock_data", {})
            state["error"] = result.get("error")
            state["last_agent"] = "inventory"
            state["agent_executed"] = True  # Mark as executed

            # Save to database
            self._save_conversation(
                state.get("user_id", 1),
                query,
                "inventory",
                "completed",
                state["response"]
            )

            return state
        except Exception as e:
            state["error"] = f"Inventory agent failed: {str(e)}"
            state["agent_executed"] = True
            return state

    def payment_node(self, state: AgentState) -> AgentState:
        """Execute Payment Agent with retry logic"""
        try:
            query = state.get("query", "")
            result = self.payment_agent.process(query)

            state["response"] = result.get("response", "")
            state["payment_result"] = result.get("payment_data", {})
            state["error"] = result.get("error")
            state["last_agent"] = "payment"
            state["agent_executed"] = True  # Mark as executed

            # Save to database
            self._save_conversation(
                state.get("user_id", 1),
                query,
                "payment",
                "completed",
                state["response"]
            )

            return state
        except Exception as e:
            state["error"] = f"Payment agent failed: {str(e)}"
            state["agent_executed"] = True
            return state

    def support_node(self, state: AgentState) -> AgentState:
        """Execute Support Agent"""
        try:
            query = state.get("query", "")
            result = self.support_agent.process(query)

            state["response"] = result.get("response", "")
            state["support_response"] = result.get("support_data", {})
            state["error"] = result.get("error")
            state["last_agent"] = "support"
            state["agent_executed"] = True  # Mark as executed

            # Save to database
            self._save_conversation(
                state.get("user_id", 1),
                query,
                "support",
                "completed",
                state["response"]
            )

            return state
        except Exception as e:
            state["error"] = f"Support agent failed: {str(e)}"
            state["agent_executed"] = True
            return state

    def final_response(self, state: AgentState) -> AgentState:
        """Generate final response"""
        # If we already have a response from an agent, use it
        if state.get("response"):
            print("📤 Returning agent response...")
            return state

        query = state.get("query", "").lower()
        user_id = state.get("user_id", 1)

        greetings = ["hello", "hi", "hey", "good morning", "good afternoon"]
        farewells = ["thanks", "thank you", "bye", "goodbye"]
        general_questions = ["how are you", "what's up", "how's it going"]
        
        if any(g in query for g in greetings):
            state["response"] = """
    👋 **Hello! Welcome to Synretic!**

    I'm your AI shopping assistant. I can help you with:
    - 🛍️ **Product Recommendations** - Find the perfect products
    - 📦 **Inventory Check** - Check stock availability
    - 💳 **Payment Processing** - Complete your purchase
    - 🛟 **Customer Support** - Track orders, returns, and more

    How can I help you today?
    """
        elif any(g in query for g in farewells):
            state["response"] = """
    You're welcome! 😊

    If you need any help with shopping, product recommendations, or order tracking, I'm here for you. 

    Have a great day! 👋
    """
        elif any(g in query for g in general_questions):
            state["response"] = """
    I'm doing great, thank you for asking! 😊

    I'm your AI shopping assistant here to help you with:
    - 🛍️ Finding products
    - 📦 Checking stock
    - 💳 Processing payments
    - 🛟 Tracking orders

    What can I help you with today?
    """
        else:
            state["response"] = """
    🤔 I'm not sure how to help with that.

    I'm a shopping assistant specialized in:
    - 🛍️ **Product Recommendations** - Find products
    - 📦 **Inventory Check** - Check stock
    - 💳 **Payment Processing** - Complete purchases
    - 🛟 **Customer Support** - Track orders and returns

    Could you please rephrase your request related to shopping?
    """

        # Save to database
        self._save_conversation(
            user_id,
            query,
            "final",
            "completed",
            state["response"]
        )

        return state

    def handle_error(self, state: AgentState) -> AgentState:
        """Handle errors gracefully"""
        error = state.get("error", "Unknown error occurred")
        state["response"] = f"❌ I encountered an error: {error}\n\nPlease try again with a different request."
        state["agent_executed"] = True

        # Save error to database
        self._save_conversation(
            state.get("user_id", 1),
            state.get("query", ""),
            "error",
            "failed",
            state["response"]
        )

        return state

    def _save_conversation(self, user_id: int, query: str, agent: str, status: str, response: str = None):
        """Save conversation to PostgreSQL"""
        try:
            db = SessionLocal()
            conversation = Conversation(
                user_id=user_id,
                thread_id=f"user_{user_id}",
                message=query,
                response=response or "Processing...",
                agent_used=agent,
                timestamp=datetime.now(timezone.utc)
            )
            db.add(conversation)
            db.commit()
            db.close()
        except Exception as e:
            print(f"⚠️ Failed to save conversation: {e}")
            # Continue without saving - don't break the flow

    def get_conversation_history(self, user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """Get conversation history for a user"""
        try:
            db = SessionLocal()
            conversations = db.query(Conversation).filter(
                Conversation.user_id == user_id
            ).order_by(Conversation.timestamp.desc()).limit(limit).all()
            db.close()

            return [{
                'message': c.message,
                'response': c.response,
                'agent': c.agent_used,
                'timestamp': c.timestamp.isoformat()
            } for c in conversations]
        except Exception as e:
            print(f"⚠️ Failed to get conversation history: {e}")
            return []

    def process(self, query: str, user_id: int = 1, thread_id: str = None) -> Dict[str, Any]:
        """Process a user query through the supervisor"""
        if thread_id is None:
            thread_id = f"user_{user_id}"

        # Determine which agent last responded to this user. Each call to process()
        # starts from a fresh in-memory state, so we can't rely on last_agent being
        # carried over automatically — look it up from the conversation log instead.
        last_agent = ""
        try:
            recent = self.get_conversation_history(user_id, limit=1)
            if recent:
                last_agent = recent[0].get("agent") or ""
        except Exception as e:
            print(f"⚠️ Could not determine last agent from history: {e}")

        initial_state = {
            "query": query,
            "user_id": user_id,
            "thread_id": thread_id,
            "current_agent": "",
            "agent_executed": False,
            "last_agent": last_agent,   # <-- was hardcoded to ""
            "products": [],
            "stock_check": {},
            "payment_result": {},
            "support_response": {},
            "response": "",
            "error": None,
            "messages": [],
            "_loop_count": 0,
            "preferences": {}
        }

        try:
            invoke_config = {"recursion_limit": 15}
            if self.use_checkpointing:
                invoke_config["configurable"] = {"thread_id": thread_id}

            final_state = self.graph.invoke(initial_state, config=invoke_config)

            return {
                "success": final_state.get("error") is None,
                "response": final_state.get("response", ""),
                "agent_used": final_state.get("last_agent", "unknown"),
                "products_found": len(final_state.get("products", [])),
                "error": final_state.get("error")
            }
        except Exception as e:
            return {
                "success": False,
                "response": f"Error: {str(e)}",
                "agent_used": "error",
                "last_agent": "",
                "products_found": 0,
                "error": str(e)
            }
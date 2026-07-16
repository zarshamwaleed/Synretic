from typing import Dict, Any
from langgraph.graph import StateGraph, END
from langchain_core.prompts import ChatPromptTemplate
import os
import sys
import re
from .state import AgentState
from .llm_router import get_llm
import warnings
warnings.filterwarnings("ignore")

# Import database directly
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'database'))
from models import SessionLocal, Order

class SupportGraph:
    """Support Agent built with LangGraph"""
    
    def __init__(self):
        self.llm = get_llm()
        self.graph = self._build_graph()
    
    def _build_graph(self):
        graph = StateGraph(AgentState)
        
        graph.add_node("extract_order_id", self.extract_order_id)
        graph.add_node("process_support", self.process_support)
        graph.add_node("generate_support_response", self.generate_response)
        graph.add_node("handle_error", self.handle_error)
        
        graph.set_entry_point("extract_order_id")
        graph.add_edge("extract_order_id", "process_support")
        graph.add_edge("process_support", "generate_support_response")
        graph.add_edge("generate_support_response", END)
        graph.add_edge("handle_error", END)
        
        return graph.compile()
    
    def extract_order_id(self, state: AgentState) -> AgentState:
        """Extract order ID from query or detect greeting"""
        try:
            query = state.get("query", "").lower()
            print(f"🔍 Extracting order ID from: {query}")
            
            # Check if it's a greeting or general query (no order number)
            greetings = ["hello", "hi", "hey", "good morning", "good afternoon", "help", "thanks", "thank you"]
            if any(g in query for g in greetings) and not re.search(r'\d+', query):
                print("ℹ️ Detected greeting - skipping order fetch")
                state["order_id"] = None
                return state
            
            # Try regex to extract order ID
            import re
            patterns = [
                r'order\s*(?:number\s*)?#?\s*(\d+)',
                r'track\s*order\s*#?\s*(\d+)',
                r'status\s*of\s*order\s*#?\s*(\d+)',
                r'#(\d+)',
                r'order\s*(\d+)',
            ]
            
            order_id = None
            for pattern in patterns:
                match = re.search(pattern, query, re.IGNORECASE)
                if match:
                    order_id = int(match.group(1))
                    print(f"✅ Extracted order ID: {order_id} using regex")
                    break
            
            # If regex failed, use LLM
            if not order_id:
                prompt = ChatPromptTemplate.from_template("""
                    Extract the order number from this query: {query}
                    Return ONLY the number.
                    If no order number is found, return 0.
                """)
                
                chain = prompt | self.llm
                response = chain.invoke({"query": query})
                
                try:
                    order_id = int(response.content.strip())
                except:
                    order_id = 0
            
            state["order_id"] = order_id if order_id > 0 else None
            print(f"✅ Final order ID: {state['order_id']}")
            return state
            
        except Exception as e:
            print(f"❌ Error extracting order ID: {e}")
            state["order_id"] = None
            state["error"] = f"Failed to extract order ID: {str(e)}"
            return state
    
    def process_support(self, state: AgentState) -> AgentState:
        """Process support request - Direct database query"""
        try:
            order_id = state.get("order_id")
            query = state.get("query", "").lower()
            
            # If no order ID (greeting), return greeting response
            if not order_id:
                state["support_response"] = {
                    "success": True,
                    "is_greeting": True,
                    "message": "Hello! How can I help you with your orders today?"
                }
                return state
            
            # Direct database query
            db = SessionLocal()
            order = db.query(Order).filter(Order.id == order_id).first()
            db.close()
            
            if order:
                state["support_response"] = {
                    "success": True,
                    "order_id": order.id,
                    "status": order.status,
                    "tracking_number": order.tracking_number or "Not available",
                    "payment_status": order.payment_status,
                    "total_amount": order.total_amount,
                    "message": f"Order #{order.id} is {order.status}"
                }
            else:
                state["support_response"] = {
                    "success": False,
                    "order_id": order_id,
                    "status": "Unknown",
                    "message": f"Order #{order_id} not found"
                }
            
            return state
            
        except Exception as e:
            state["error"] = f"Support processing failed: {str(e)}"
            return state
    
    def generate_response(self, state: AgentState) -> AgentState:
        """Generate support response"""
        result = state.get("support_response", {})
        
        # If it's a greeting
        if result.get("is_greeting"):
            state["response"] = """
    👋 **Hello! Welcome to Synretic Support!**

    I can help you with:
    - 📦 **Order Tracking** - Check your order status
    - 🔄 **Returns & Refunds** - Process returns
    - 📍 **Shipping Info** - Track your package
    - ❓ **Order Questions** - Any other questions

    To track an order, just say: "Track my order number X"
    """
            return state
        
        if result.get("success"):
            state["response"] = f"""
    ✅ **Order Information**

    Order ID: {result.get('order_id', 'N/A')}
    Status: {result.get('status', 'Unknown')}
    Tracking: {result.get('tracking_number', 'Not available')}
    Payment: {result.get('payment_status', 'Unknown')}
    Amount: ${result.get('total_amount', 0)}

    {result.get('message', '')}

    How can I assist you further?
    """
        else:
            state["response"] = f"""
    ℹ️ **Order Information**

    Order ID: {result.get('order_id', 'N/A')}
    Status: {result.get('status', 'Unknown')}
    Message: {result.get('message', 'No information available')}

    Please check the order number and try again.
    """
        return state
    
    def handle_error(self, state: AgentState) -> AgentState:
        error = state.get("error", "Unknown error")
        state["response"] = f"❌ Support error: {error}"
        return state
    
    def process(self, query: str, user_id: int = 1) -> Dict[str, Any]:
        initial_state = {
            "query": query,
            "user_id": user_id,
            "order_id": 0,
            "support_response": {},
            "response": "",
            "error": None
        }
        
        final_state = self.graph.invoke(initial_state)
        
        return {
            "agent": "Support",
            "success": final_state.get("error") is None,
            "response": final_state.get("response", ""),
            "support_data": final_state.get("support_response", {}),
            "error": final_state.get("error")
        }
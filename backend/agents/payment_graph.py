from typing import Dict, Any
from langgraph.graph import StateGraph, END
from langchain_core.prompts import ChatPromptTemplate
import os
import json  # Add this import
from .state import AgentState
from .tools import process_payment, refund_payment
from .llm_router import get_llm
import warnings
warnings.filterwarnings("ignore")

class PaymentGraph:
    """Payment Agent built with LangGraph"""
    
    def __init__(self):
        self.llm = get_llm()
        self.graph = self._build_graph()
    
    def _build_graph(self):
        graph = StateGraph(AgentState)
        
        graph.add_node("extract_payment_details", self.extract_payment_details)
        graph.add_node("process_payment_node", self.process_payment_node)
        graph.add_node("generate_payment_response", self.generate_response)
        graph.add_node("handle_error", self.handle_error)
        
        graph.set_entry_point("extract_payment_details")
        graph.add_edge("extract_payment_details", "process_payment_node")
        graph.add_edge("process_payment_node", "generate_payment_response")
        graph.add_edge("generate_payment_response", END)
        graph.add_edge("handle_error", END)
        
        return graph.compile()
    
    def extract_payment_details(self, state: AgentState) -> AgentState:
        """Extract payment details from query or use product info"""
        try:
            query = state.get("query", "")
            
            # Check if we have product info from inventory
            selected_product = state.get("selected_product", {})
            if selected_product and "confirm" not in query:
                # Use product info for payment
                state["order_id"] = 1  # Default order ID
                state["amount"] = selected_product.get("price", 100)
                state["user_id"] = state.get("user_id", 1)
                print(f"💳 Using product info: {selected_product.get('name')} - ${state['amount']}")
                return state
            
            # Otherwise extract from query
            import re
            order_match = re.search(r'order\s*(?:number\s*)?#?\s*(\d+)', query, re.IGNORECASE)
            order_id = int(order_match.group(1)) if order_match else 1
            
            amount_match = re.search(r'\$?(\d+\.?\d*)', query)
            amount = float(amount_match.group(1)) if amount_match else 100
            
            state["order_id"] = order_id
            state["amount"] = amount
            state["user_id"] = state.get("user_id", 1)
            
            print(f"💳 Payment details - Order: {order_id}, Amount: ${amount}")
            return state
            
        except Exception as e:
            state["error"] = f"Failed to extract details: {str(e)}"
            return state
    
    def process_payment_node(self, state: AgentState) -> AgentState:
        """Process the payment"""
        try:
            order_id = state.get("order_id", 1)
            amount = state.get("amount", 100)
            user_id = state.get("user_id", 1)
            
            result = process_payment.invoke({
                "user_id": user_id,
                "order_id": order_id,
                "amount": amount
            })
            state["payment_result"] = json.loads(result) if isinstance(result, str) else result
            return state
            
        except Exception as e:
            state["error"] = f"Payment processing failed: {str(e)}"
            return state
    
    def generate_response(self, state: AgentState) -> AgentState:
        """Generate payment response"""
        result = state.get("payment_result", {})
        
        if result.get("success"):
            state["response"] = f"""
✅ **Payment Successful!**

Order ID: {result.get('order_id', 'N/A')}
Amount: ${result.get('amount', 0)}
Attempts: {result.get('attempts', 1)}
Status: {result.get('message', 'Completed')}

Your order has been confirmed. You will receive a confirmation email shortly.
"""
        else:
            state["response"] = f"""
❌ **Payment Failed**

Order ID: {result.get('order_id', 'N/A')}
Amount: ${result.get('amount', 0)}
Attempts: {result.get('attempts', 3)}
Status: {result.get('message', 'Failed')}

Please try again with a different payment method or contact support.
"""
        return state
    
    def handle_error(self, state: AgentState) -> AgentState:
        error = state.get("error", "Unknown error")
        state["response"] = f"❌ Payment error: {error}"
        return state
    
    def process(self, query: str, user_id: int = 1) -> Dict[str, Any]:
        initial_state = {
            "query": query,
            "user_id": user_id,
            "order_id": 0,
            "amount": 0,
            "payment_result": {},
            "response": "",
            "error": None
        }
        
        final_state = self.graph.invoke(initial_state)
        
        return {
            "agent": "Payment",
            "success": final_state.get("error") is None,
            "response": final_state.get("response", ""),
            "payment_data": final_state.get("payment_result", {}),
            "error": final_state.get("error")
        }
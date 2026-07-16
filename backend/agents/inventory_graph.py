from typing import Dict, Any
from langgraph.graph import StateGraph, END
from langchain_core.prompts import ChatPromptTemplate
import os
import json
import re
from .state import AgentState
from .llm_router import get_llm
import warnings
warnings.filterwarnings("ignore")

# Import database directly
import sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'database'))
from models import SessionLocal, Product

class InventoryGraph:
    """Inventory Agent built with LangGraph"""
    
    def __init__(self):
        self.llm = get_llm()
        self.graph = self._build_graph()
    
    def _build_graph(self):
        graph = StateGraph(AgentState)
        
        graph.add_node("check_product", self.check_product)
        graph.add_node("check_stock", self.check_stock)
        graph.add_node("generate_response", self.generate_response)
        graph.add_node("handle_error", self.handle_error)
        
        graph.set_entry_point("check_product")
        graph.add_edge("check_product", "check_stock")
        graph.add_edge("check_stock", "generate_response")
        graph.add_edge("generate_response", END)
        graph.add_edge("handle_error", END)
        
        return graph.compile()
    
    def check_product(self, state: AgentState) -> AgentState:
        """Extract product ID from query"""
        try:
            query = state.get("query", "")
            print(f"🔍 Inventory - Extracting product from: {query}")
            
            # Check if query contains product name (like "Samba")
            import re
            # Try to find product name in query (e.g., "do you have Samba?")
            name_match = re.search(r'(?:have|find|get|check)\s+(\w+)', query, re.IGNORECASE)
            if name_match:
                product_name = name_match.group(1)
                print(f"✅ Extracted product name: {product_name}")
                
                # Search for product by name in database
                db = SessionLocal()
                product = db.query(Product).filter(Product.name.ilike(f'%{product_name}%')).first()
                db.close()
                
                if product:
                    print(f"✅ Found product by name: {product.name} (ID: {product.id})")
                    state["product_id"] = product.id
                    return state
            
            # Try regex for product ID
            match = re.search(r'product\s*id\s*(\d+)', query, re.IGNORECASE)
            if match:
                product_id = int(match.group(1))
                state["product_id"] = product_id
                print(f"✅ Extracted product ID: {product_id} using regex")
                return state
            
            # If no product found, use LLM
            prompt = ChatPromptTemplate.from_template("""
                Extract product ID from this query: {query}
                Return only the number.
                If no product ID found, return 1.
            """)
            
            chain = prompt | self.llm
            response = chain.invoke({"query": query})
            
            try:
                product_id = int(response.content.strip())
            except:
                product_id = 1
            
            state["product_id"] = product_id
            print(f"✅ Extracted product ID: {product_id} using LLM")
            return state
            
        except Exception as e:
            print(f"❌ Error extracting product: {e}")
            state["error"] = f"Failed to check product: {str(e)}"
            return state
    
    def check_stock(self, state: AgentState) -> AgentState:
        """Check stock for product - Direct database query"""
        try:
            product_id = state.get("product_id", 1)
            print(f"🔍 Checking stock for product ID: {product_id}")
            
            db = SessionLocal()
            product = db.query(Product).filter(Product.id == product_id).first()
            db.close()
            
            if product:
                print(f"✅ Found product: {product.name}, Stock: {product.stock}")
                state["stock_check"] = {
                    "product_id": product.id,
                    "product_name": product.name,
                    "stock": product.stock,
                    "requested": 1,
                    "available": product.stock >= 1,
                    "message": "✅ In stock" if product.stock >= 1 else "❌ Out of stock",
                    "price": product.price  # ← ADD PRICE
                }
                # Store product info for payment
                state["selected_product"] = {
                    "id": product.id,
                    "name": product.name,
                    "price": product.price,
                    "stock": product.stock
                }
            else:
                print(f"❌ Product ID {product_id} not found")
                state["stock_check"] = {
                    "product_id": product_id,
                    "product_name": "Product",
                    "stock": 0,
                    "requested": 1,
                    "available": False,
                    "message": "Product not found"
                }
            
            return state
            
        except Exception as e:
            print(f"❌ Stock check error: {e}")
            state["error"] = f"Failed to check stock: {str(e)}"
            return state
    
    def generate_response(self, state: AgentState) -> AgentState:
        """Generate stock response"""
        stock = state.get("stock_check", {})
        
        if not stock or not stock.get("available"):
            state["response"] = f"""
❌ **Product Out of Stock**

Product: {stock.get('product_name', 'Product')}
Stock Available: {stock.get('stock', 0)}
Requested: {stock.get('requested', 1)}
Status: {stock.get('message', 'Out of stock')}

Would you like me to check similar products?
"""
        else:
            state["response"] = f"""
✅ **Product in Stock!**

Product: {stock.get('product_name', 'Product')}
Stock Available: {stock.get('stock', 0)}
Requested: {stock.get('requested', 1)}
Status: {stock.get('message', 'In stock')}

Would you like to purchase this product?
"""
        return state
    
    def handle_error(self, state: AgentState) -> AgentState:
        error = state.get("error", "Unknown error")
        state["response"] = f"❌ Inventory check failed: {error}"
        return state
    
    def process(self, query: str, user_id: int = 1) -> Dict[str, Any]:
        initial_state = {
            "query": query,
            "user_id": user_id,
            "product_id": 0,
            "stock_check": {},
            "response": "",
            "error": None
        }
        
        final_state = self.graph.invoke(initial_state)
        
        return {
            "agent": "Inventory",
            "success": final_state.get("error") is None,
            "response": final_state.get("response", ""),
            "stock_data": final_state.get("stock_check", {}),
            "error": final_state.get("error")
        }
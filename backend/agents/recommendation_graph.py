from typing import Dict, Any, List, Optional
from .llm_router import get_llm
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import create_react_agent
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage
import os
import json
import re
import warnings
warnings.filterwarnings("ignore")

# Try to import Cloudflare with error handling
try:
    from langchain_community.chat_models import ChatCloudflareWorkersAI
    CLOUDFLARE_AVAILABLE = True
except ImportError:
    try:
        from langchain_cloudflare import ChatCloudflare
        CLOUDFLARE_AVAILABLE = True
    except ImportError:
        CLOUDFLARE_AVAILABLE = False

# Import tools
from .tools import search_products, get_product_by_id, get_user_history
from .tools import search_products_func
from .state import AgentState

class RecommendationGraph:
    """Recommendation Agent built with modern LangGraph"""
    
    def __init__(self):
        # Initialize LLM with multi-provider support
        self.llm = get_llm()
        
        # Create ReAct agent with tools
        self.agent = create_react_agent(
            model=self.llm,
            tools=[search_products, get_product_by_id, get_user_history],
            prompt="You are a helpful shopping assistant specializing in product recommendations."
        )
        
        # Build the graph
        self.graph = self._build_graph()
        self.last_results = []  # Store last search results
        self.last_query = ""    # Store last query
    
    def _initialize_llm(self):
        """Initialize LLM with fallback to multiple providers"""
        print("🔧 Initializing LLM with multi-provider support...")
        
        # Try Groq first
        groq_key = os.getenv("GROQ_API_KEY")
        if groq_key:
            try:
                llm = ChatGroq(
                    model="llama-3.3-70b-versatile",
                    temperature=0.1,
                    api_key=groq_key
                )
                print("✅ Using Groq provider")
                return llm
            except Exception as e:
                print(f"⚠️ Groq failed: {e}")
        
        # Try Google Gemini
        google_key = os.getenv("GOOGLE_API_KEY")
        if google_key:
            try:
                llm = ChatGoogleGenerativeAI(
                    model="gemini-2.0-flash",
                    temperature=0.1,
                    google_api_key=google_key
                )
                print("✅ Using Google Gemini provider")
                return llm
            except Exception as e:
                print(f"⚠️ Google Gemini failed: {e}")
        
        # Try Cloudflare (if available)
        if CLOUDFLARE_AVAILABLE:
            cloudflare_key = os.getenv("CLOUDFLARE_API_KEY")
            if cloudflare_key:
                try:
                    try:
                        from langchain_community.chat_models import ChatCloudflareWorkersAI
                        llm = ChatCloudflareWorkersAI(
                            model="@cf/meta/llama-3.3-70b-instruct",
                            temperature=0.1,
                            api_key=cloudflare_key
                        )
                    except:
                        from langchain_cloudflare import ChatCloudflare
                        llm = ChatCloudflare(
                            model="@cf/meta/llama-3.3-70b-instruct",
                            temperature=0.1,
                            api_key=cloudflare_key
                        )
                    print("✅ Using Cloudflare provider")
                    return llm
                except Exception as e:
                    print(f"⚠️ Cloudflare failed: {e}")
        
        # If all fail
        raise Exception("❌ No working LLM provider found. Check your API keys in .env")
    
    def _build_graph(self):
        """Build the LangGraph workflow"""
        graph = StateGraph(AgentState)
        
        # Add nodes
        graph.add_node("analyze_query", self.analyze_query)
        graph.add_node("search_products", self.search_products)
        graph.add_node("generate_recommendations", self.generate_recommendations)
        graph.add_node("handle_error", self.handle_error)
        
        # Add edges
        graph.set_entry_point("analyze_query")
        graph.add_edge("analyze_query", "search_products")
        graph.add_edge("search_products", "generate_recommendations")
        graph.add_edge("generate_recommendations", END)
        graph.add_edge("handle_error", END)
        
        return graph.compile()
    
    def analyze_query(self, state: AgentState) -> AgentState:
        """Analyze user query using direct LLM call (no tools)"""
        try:
            query = state.get("query", "")
            
            # Store original query for later use
            self.last_query = query
            
            # If query is "yes", "sure", etc., use last query
            if query.lower() in ["yes", "sure", "ok", "okay", "more details", "tell me more", "details"]:
                if self.last_results:
                    state["preferences"] = {"use_last_results": True}
                    state["query"] = "Show me more details"
                    return state
            
            prompt = f"""
            Extract product preferences from this query and return as JSON.
            Query: {query}
            
            Return ONLY valid JSON with these fields:
            - category: (e.g., "shoes", "running shoes", "casual", "lifestyle", "basketball")
            - brand: (e.g., "Nike", "Adidas", "Puma") or "any"
            - size: (e.g., "9", "10", "11") or "any"
            - color: (e.g., "black", "white", "blue") or "any"
            
            Example: {{"category": "running shoes", "brand": "Nike", "size": "9", "color": "black"}}
            
            If you can't determine a value, use "any".
            """
            
            # Use LLM directly without tools
            response = self.llm.invoke([HumanMessage(content=prompt)])
            
            # Parse response
            try:
                content = response.content
                # Clean the response to extract JSON
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    preferences = json.loads(json_match.group())
                else:
                    preferences = {"category": "shoes", "brand": "any", "size": "any", "color": "any"}
            except:
                preferences = {"category": "shoes", "brand": "any", "size": "any", "color": "any"}
            
            state["preferences"] = preferences
            return state
            
        except Exception as e:
            state["error"] = f"Failed to analyze query: {str(e)}"
            return state
    
    def search_products(self, state: AgentState) -> AgentState:
        """Search for products based on preferences"""
        try:
            preferences = state.get("preferences", {})
            
            # Check if we should use last results
            if preferences.get("use_last_results") and self.last_results:
                state["products"] = self.last_results
                print(f"✅ Using cached results: {len(self.last_results)} products")
                return state
            
            # Build search query from preferences
            search_parts = []
            
            # Category
            category = preferences.get("category", "")
            if category and category != "any" and category != "Any":
                search_parts.append(category)
            
            # Brand
            brand = preferences.get("brand", "")
            if brand and brand != "any" and brand != "Any":
                search_parts.append(brand)
            
            # Color
            color = preferences.get("color", "")
            if color and color != "any" and color != "Any":
                search_parts.append(color)
            
            # Size
            size = preferences.get("size", "")
            if size and size != "any" and size != "Any":
                search_parts.append(size)
            
            # If no specific terms, use the original query
            if not search_parts:
                query = state.get("query", "shoes")
            else:
                query = " ".join(search_parts)
            
            # Search using ChromaDB
            products = search_products_func(query, limit=5)
            state["products"] = products if products else []
            
            # Store results for follow-up
            self.last_results = state["products"]
            
            return state
            
        except Exception as e:
            state["error"] = f"Failed to search products: {str(e)}"
            return state
    
    def generate_recommendations(self, state: AgentState) -> AgentState:
        """Generate personalized recommendations with beautiful formatting"""
        try:
            products = state.get("products", [])
            preferences = state.get("preferences", {})
            
            # Check if this is a "yes" response using cached results
            if preferences.get("use_last_results") and self.last_results:
                products = self.last_results
                state["products"] = products
                return self._generate_detailed_response(state)
            
            if not products or products == []:
                state["response"] = "❌ No products found matching your criteria. Please try different search terms."
                return state
            
            # Filter out error entries
            valid_products = [p for p in products if 'error' not in p]
            
            if not valid_products:
                state["response"] = "❌ No valid products found. Please try a different search."
                return state
            
            # Build beautiful response
            response = "🛍️ **Product Recommendations**\n\n"
            response += f"📌 Based on your preferences:\n"
            response += f"   • Category: {preferences.get('category', 'Any')}\n"
            response += f"   • Brand: {preferences.get('brand', 'Any')}\n"
            response += f"   • Size: {preferences.get('size', 'Any')}\n"
            response += f"   • Color: {preferences.get('color', 'Any')}\n\n"
            
            for i, p in enumerate(valid_products[:5], 1):
                price = p.get('price', 'N/A')
                if price != 'N/A' and price is not None:
                    price = f"${price}"
                
                stock = p.get('stock', 'N/A')
                if stock != 'N/A' and stock is not None:
                    stock = f"{stock} units"
                
                response += f"**{i}. {p.get('name', 'Unknown')}**\n"
                response += f"   🏷️ Brand: {p.get('brand', 'N/A')}\n"
                response += f"   📂 Category: {p.get('category', 'N/A')}\n"
                response += f"   💰 Price: {price}\n"
                response += f"   📏 Size: {p.get('size', 'N/A')}\n"
                response += f"   🎨 Color: {p.get('color', 'N/A')}\n"
                response += f"   📦 Stock: {stock}\n"
                response += f"   📝 {p.get('description', '')[:120]}...\n\n"
            
            response += "💡 Would you like more details on any of these? Just say **'yes'** or ask about a specific product!"
            
            state["response"] = response
            return state
            
        except Exception as e:
            state["error"] = f"Failed to generate recommendations: {str(e)}"
            return state
    
    def _generate_detailed_response(self, state: AgentState) -> AgentState:
        """Generate detailed response for products with beautiful formatting"""
        products = state.get("products", [])
        
        if not products:
            state["response"] = "I don't have any products to show details for."
            return state
        
        response = "📋 **Product Details**\n\n"
        
        for i, p in enumerate(products[:5], 1):
            # Get price with fallback
            price = p.get('price', 'N/A')
            if price != 'N/A' and price is not None:
                price = f"${price}"
            
            # Get stock with fallback
            stock = p.get('stock', 'N/A')
            if stock != 'N/A' and stock is not None:
                stock = f"{stock} units"
            
            response += f"**{i}. {p.get('name', 'Unknown')}**\n"
            response += f"   🏷️ Brand: {p.get('brand', 'N/A')}\n"
            response += f"   📂 Category: {p.get('category', 'N/A')}\n"
            response += f"   💰 Price: {price}\n"
            response += f"   📏 Size: {p.get('size', 'N/A')}\n"
            response += f"   🎨 Color: {p.get('color', 'N/A')}\n"
            response += f"   📦 Stock: {stock}\n"
            response += f"   📝 Description: {p.get('description', 'No description available')}\n\n"
        
        response += "🛒 Would you like to add any of these to your cart?\n"
        response += "   Just say: **'Add [product name] to cart'**"
        
        state["response"] = response
        return state
    
    def handle_error(self, state: AgentState) -> AgentState:
        """Handle errors gracefully"""
        error = state.get("error", "Unknown error occurred")
        state["response"] = f"Sorry, I encountered an error: {error}"
        return state
    
    def process(self, query: str, user_id: int = 1, preferences: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Process a recommendation query"""

        # Supervisor explicitly asked us to reuse the last search results
        # rather than treat this as a brand-new search.
        if preferences and preferences.get("use_last_results") and self.last_results:
            initial_state = {
                "query": query,
                "user_id": user_id,
                "products": self.last_results,
                "preferences": {"use_last_results": True},
                "response": "",
                "error": None
            }
            final_state = self._generate_detailed_response(initial_state)
            return {
                "agent": "Recommendation",
                "success": True,
                "response": final_state.get("response", ""),
                "products_found": len(self.last_results),
                "error": None
            }

        # Fallback for callers that hit this agent directly (no supervisor
        # involved) with a bare confirmation word.
        if query.lower().strip() in ["yes", "sure", "ok", "okay", "more details", "tell me more", "details"]:
            if hasattr(self, 'last_results') and self.last_results:
                initial_state = {
                    "query": query,
                    "user_id": user_id,
                    "products": self.last_results,
                    "preferences": {"use_last_results": True},
                    "response": "",
                    "error": None
                }
                final_state = self._generate_detailed_response(initial_state)
                return {
                    "agent": "Recommendation",
                    "success": True,
                    "response": final_state.get("response", ""),
                    "products_found": len(self.last_results),
                    "error": None
                }

        initial_state = {
            "query": query,
            "user_id": user_id,
            "products": [],
            "preferences": {},
            "response": "",
            "error": None
        }

        try:
            final_state = self.graph.invoke(initial_state)
            if final_state.get('products'):
                self.last_results = final_state.get('products', [])
                self.last_query = query
            return {
                "agent": "Recommendation",
                "success": final_state.get("error") is None,
                "response": final_state.get("response", ""),
                "products_found": len(final_state.get("products", [])),
                "error": final_state.get("error")
            }
        except Exception as e:
            return {
                "agent": "Recommendation",
                "success": False,
                "response": f"Error: {str(e)}",
                "products_found": 0,
                "error": str(e)
            }
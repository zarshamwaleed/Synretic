from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ChatRequest(BaseModel):
    """Chat request model"""
    query: str = Field(..., description="User query")
    user_id: int = Field(default=1, description="User ID")
    thread_id: Optional[str] = Field(None, description="Thread ID for conversation")

class ChatResponse(BaseModel):
    """Chat response model"""
    success: bool
    response: str
    agent_used: str
    products_found: int = 0
    error: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)

class ProductResponse(BaseModel):
    """Product response model"""
    id: int
    name: str
    description: str
    category: str
    price: float
    stock: int
    brand: str
    size: str
    color: str
    image: Optional[str] = None  # ← ADD THIS
    variations: Optional[List[Dict[str, Any]]] = None  # ← ADD THIS

class OrderRequest(BaseModel):
    """Order request model"""
    user_id: int
    product_id: int
    quantity: int = 1
    shipping_address: Dict[str, str]

class OrderResponse(BaseModel):
    """Order response model"""
    order_id: int
    user_id: int
    product_id: int
    quantity: int
    total_amount: float
    status: str
    payment_status: str
    order_date: datetime
    tracking_number: Optional[str] = None

class UserProfile(BaseModel):
    """User profile model"""
    id: int
    name: str
    email: str
    preferences: Dict[str, Any]
    purchase_history: List[Dict[str, Any]]
    created_at: datetime

class WebSocketMessage(BaseModel):
    """WebSocket message model"""
    type: str  # "status", "response", "error"
    content: str
    data: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.now)
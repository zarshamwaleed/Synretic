from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json
import asyncio
from datetime import datetime, timezone
from backend.api.models import WebSocketMessage
from backend.agents.supervisor_graph import SupervisorGraph

class WebSocketManager:
    """Manage WebSocket connections"""
    
    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        self.supervisor = SupervisorGraph(use_checkpointing=False)
    
    async def connect(self, user_id: int, websocket: WebSocket):
        """Accept WebSocket connection"""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        
        # Send welcome message
        await self.send_message(user_id, "connected", "Connected to Synretic AI")
    
    def disconnect(self, user_id: int, websocket: WebSocket):
        """Remove WebSocket connection"""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
    
    async def send_message(self, user_id: int, msg_type: str, content: str, data: dict = None):
        """Send message to all connections for a user"""
        if user_id not in self.active_connections:
            return
        
        message = WebSocketMessage(
            type=msg_type,
            content=content,
            data=data
        )
        
        # Send to all connections for this user
        for websocket in self.active_connections[user_id]:
            try:
                await websocket.send_text(json.dumps(message.dict(), default=str))
            except:
                pass
    
    async def process_query(self, user_id: int, query: str, websocket: WebSocket):
        """Process query and stream responses"""
        try:
            # Send processing status
            await self.send_message(user_id, "status", "Processing your request...")
            
            # Process with supervisor
            result = self.supervisor.process(query=query, user_id=user_id)
            
            # Send result
            if result.get("success"):
                await self.send_message(
                    user_id, 
                    "response", 
                    result.get("response", ""),
                    {
                        "agent_used": result.get("agent_used"),
                        "products_found": result.get("products_found", 0)
                    }
                )
            else:
                await self.send_message(
                    user_id,
                    "error",
                    result.get("response", "An error occurred"),
                    {"error": result.get("error")}
                )
                
        except Exception as e:
            await self.send_message(user_id, "error", f"Error: {str(e)}")

# Global WebSocket manager
ws_manager = WebSocketManager()

async def websocket_handler(websocket: WebSocket, user_id: int):
    """Handle WebSocket connection"""
    await ws_manager.connect(user_id, websocket)
    
    try:
        while True:
            # Wait for messages from client
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                query = message.get("query", "")
                
                if query:
                    # Process the query
                    await ws_manager.process_query(user_id, query, websocket)
                else:
                    await ws_manager.send_message(user_id, "error", "No query provided")
                    
            except json.JSONDecodeError:
                await ws_manager.send_message(user_id, "error", "Invalid JSON format")
                
    except WebSocketDisconnect:
        ws_manager.disconnect(user_id, websocket)
        print(f"User {user_id} disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        ws_manager.disconnect(user_id, websocket)
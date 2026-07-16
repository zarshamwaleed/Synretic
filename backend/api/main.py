from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from datetime import datetime

from backend.api.routes import chat, products, orders, user
from backend.api.websocket import websocket_handler

# Create FastAPI app
app = FastAPI(
    title="Synretic AI Shopping Assistant API",
    description="Multi-agent AI system for retail orchestration",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ============ CORS Configuration ============
# Allow all origins for development - restrict in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*",  # For development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ Include Routers ============
app.include_router(chat.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(user.router)

# ============ WebSocket Endpoint ============
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await websocket_handler(websocket, user_id)

# ============ Health Check ============
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "Synretic AI"
    }

# ============ Root Endpoint ============
@app.get("/")
async def root():
    return {
        "service": "Synretic AI Shopping Assistant",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "websocket": "ws://localhost:8000/ws/{user_id}"
    }

# ============ Global Error Handler ============
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": str(exc),
            "timestamp": datetime.now().isoformat()
        }
    )

# ============ Run Server ============
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
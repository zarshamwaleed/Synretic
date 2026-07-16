import requests
import json
import websockets
import asyncio

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    response = requests.get(f"{BASE_URL}/health")
    print(f"Health: {response.json()}")

def test_chat():
    """Test chat endpoint"""
    payload = {
        "query": "Find me black running shoes size 9",
        "user_id": 1
    }
    response = requests.post(f"{BASE_URL}/api/chat/", json=payload)
    print(f"Chat: {response.json()}")

def test_products():
    """Test products endpoint"""
    response = requests.get(f"{BASE_URL}/api/products/?limit=5")
    print(f"Products: {response.json()[:2]}...")

async def test_websocket():
    """Test WebSocket connection"""
    uri = "ws://localhost:8000/ws/1"
    try:
        async with websockets.connect(uri) as websocket:
            # Send a query
            await websocket.send(json.dumps({"query": "Show me Nike sneakers"}))
            
            # Receive responses
            for _ in range(3):
                response = await websocket.recv()
                print(f"WebSocket: {json.loads(response)}")
    except Exception as e:
        print(f"WebSocket error: {e}")

if __name__ == "__main__":
    print("🧪 Testing API\n" + "="*50)
    
    # Test REST endpoints
    test_health()
    test_products()
    test_chat()
    
    # Test WebSocket
    asyncio.run(test_websocket())
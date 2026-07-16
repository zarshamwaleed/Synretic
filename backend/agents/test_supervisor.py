import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.supervisor_graph import SupervisorGraph
import warnings
warnings.filterwarnings("ignore")

def test_supervisor():
    print("🧪 Testing Supervisor Agent\n" + "="*60)
    
    # Create supervisor with checkpointing disabled for testing
    supervisor = SupervisorGraph(use_checkpointing=False)
    
    # Test queries for each agent
    test_queries = [
        # Recommendation queries
        "Find me black running shoes size 9",
        "I need Nike sneakers",
        "Show me casual shoes",
        
        # Inventory queries
        "Check stock for product ID 1",
        
        # Payment queries
        "Process payment of $120 for order 1",
        
        # Support queries
        "Track my order number 1",
        
        # General queries
        "Hello",
        "Thank you for your help"
    ]
    
    for i, query in enumerate(test_queries[:8], 1):
        print(f"\n📝 Test {i}: '{query}'")
        print("-" * 50)
        
        result = supervisor.process(query, user_id=1)
        
        print(f"✅ Success: {result['success']}")
        print(f"🤖 Agent Used: {result.get('agent_used', 'Unknown')}")
        print(f"📊 Products Found: {result.get('products_found', 0)}")
        print(f"\nResponse:\n{result['response'][:400]}...")
        
        if result.get('error'):
            print(f"⚠️ Error: {result['error']}")
        
        print("-" * 50)

def test_conversation_history():
    print("\n🧪 Testing Conversation History\n" + "="*60)
    
    supervisor = SupervisorGraph(use_checkpointing=False)
    
    # Process a few queries
    queries = [
        "Hello",
        "Find me black running shoes",
        "Check stock for product ID 1",
        "Thank you"
    ]
    
    for query in queries:
        supervisor.process(query, user_id=1)
    
    # Get history
    history = supervisor.get_conversation_history(1)
    print(f"\n📋 Conversation History for User 1:")
    for i, conv in enumerate(history[:5], 1):
        print(f"\n{i}. User: {conv['message']}")
        print(f"   Agent: {conv['agent']}")
        print(f"   Response: {conv['response'][:100]}...")
        print(f"   Time: {conv['timestamp']}")

if __name__ == "__main__":
    test_supervisor()
    # test_conversation_history()  # Uncomment to test history
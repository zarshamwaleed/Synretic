import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.recommendation_graph import RecommendationGraph
import warnings
warnings.filterwarnings("ignore")

def test_recommendation():
    print("🧪 Testing Recommendation Agent\n" + "="*50)
    
    try:
        agent = RecommendationGraph()
        
        test_queries = [
            "Find me black running shoes size 9",
            "I need Nike sneakers",
            "Show me casual shoes in black"
        ]
        
        for query in test_queries[:1]:
            print(f"\n📝 Query: {query}")
            print("-" * 40)
            
            result = agent.process(query)
            
            print(f"✅ Success: {result['success']}")
            print(f"Products Found: {result.get('products_found', 0)}")
            print(f"\nResponse:\n{result['response'][:500]}")
            
            if result.get('error'):
                print(f"\n⚠️ Error: {result['error']}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_recommendation()
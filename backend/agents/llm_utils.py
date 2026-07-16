import os
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI

# Cloudflare is optional - skip if not available
CLOUDFLARE_AVAILABLE = False
try:
    from langchain_community.chat_models import ChatCloudflareWorkersAI
    CLOUDFLARE_AVAILABLE = True
except ImportError:
    try:
        from langchain_cloudflare import ChatCloudflare
        CLOUDFLARE_AVAILABLE = True
    except ImportError:
        pass

def get_llm():
    """Get LLM with multi-provider fallback"""
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
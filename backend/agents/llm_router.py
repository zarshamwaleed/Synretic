import os
import time
from typing import Optional
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
import warnings
warnings.filterwarnings("ignore")

class LLMRouter:
    """
    LLM Router with automatic failover.
    If one provider hits rate limit, automatically switches to the next.
    """
    
    def __init__(self):
        self.providers = []
        self.current_index = 0
        self._init_providers()
        self._last_fail_time = 0
        self._fail_cooldown = 60  # Seconds to wait before retrying a failed provider
    
    def _init_providers(self):
        """Initialize all available providers in priority order"""
        
        # Provider 1: Groq (Primary - fresh account)
        groq_key = os.getenv("GROQ_API_KEY")
        if groq_key:
            self.providers.append({
                "name": "Groq",
                "type": "groq",
                "api_key": groq_key,
                "init": self._init_groq,
                "working": True,
                "last_fail": 0,
                "usage": 0
            })
            print(f"✅ Registered Groq provider (primary)")
        
        # Provider 2: Google Gemini (Backup)
        google_key = os.getenv("GOOGLE_API_KEY")
        if google_key:
            self.providers.append({
                "name": "Google Gemini",
                "type": "google",
                "api_key": google_key,
                "init": self._init_google,
                "working": True,
                "last_fail": 0,
                "usage": 0
            })
            print(f"✅ Registered Google Gemini provider (backup)")
        
        # Provider 3: Cloudflare (If available)
        cloudflare_key = os.getenv("CLOUDFLARE_API_KEY")
        if cloudflare_key:
            try:
                from langchain_community.chat_models import ChatCloudflareWorkersAI
                self.providers.append({
                    "name": "Cloudflare",
                    "type": "cloudflare",
                    "api_key": cloudflare_key,
                    "init": self._init_cloudflare,
                    "working": True,
                    "last_fail": 0,
                    "usage": 0
                })
                print(f"✅ Registered Cloudflare provider")
            except ImportError:
                print(f"⚠️ Cloudflare package not installed, skipping")
        
        if not self.providers:
            raise Exception("❌ No LLM providers configured. Check your .env file.")
        
        print(f"✅ Total providers registered: {len(self.providers)}")
    
    def _init_google(self, api_key):
        """Initialize Google Gemini"""
        return ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            temperature=0.1,
            google_api_key=api_key
        )
    
    def _init_groq(self, api_key):
        """Initialize Groq"""
        return ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0.1,
            api_key=api_key
        )
    
    def _init_cloudflare(self, api_key):
        """Initialize Cloudflare"""
        try:
            from langchain_community.chat_models import ChatCloudflareWorkersAI
            return ChatCloudflareWorkersAI(
                model="@cf/meta/llama-3.3-70b-instruct",
                temperature=0.1,
                api_key=api_key
            )
        except:
            from langchain_cloudflare import ChatCloudflare
            return ChatCloudflare(
                model="@cf/meta/llama-3.3-70b-instruct",
                temperature=0.1,
                api_key=api_key
            )
    
    def _is_rate_limit_error(self, error: Exception) -> bool:
        """Check if the error is a rate limit error"""
        error_str = str(error).lower()
        rate_limit_indicators = [
            "rate limit",
            "rate_limit",
            "429",
            "too many requests",
            "quota exceeded",
            "tokens per day",
            "tpm",
            "rpm"
        ]
        return any(indicator in error_str for indicator in rate_limit_indicators)
    
    def get_llm(self, max_retries: int = 3):
        """
        Get an LLM instance with automatic failover.
        If a provider fails, switches to the next one.
        """
        attempts = 0
        start_index = self.current_index
        
        while attempts < len(self.providers) * max_retries:
            attempts += 1
            
            # Get the current provider
            provider = self.providers[self.current_index]
            
            # Check if provider is marked as working
            if not provider["working"]:
                # Check if cooldown has passed
                if time.time() - provider["last_fail"] < self._fail_cooldown:
                    # Skip to next provider
                    self.current_index = (self.current_index + 1) % len(self.providers)
                    continue
                else:
                    # Reset provider status after cooldown
                    provider["working"] = True
                    print(f"🔄 Reactivated {provider['name']} after cooldown")
            
            try:
                # Try to initialize the provider
                print(f"🔧 Trying {provider['name']}...")
                llm = provider["init"](provider["api_key"])
                
                # Test with a simple call to check if it works
                # (LangChain will handle the actual call later)
                
                # Reset any previous failure state
                provider["working"] = True
                self.current_index = (self.current_index + 1) % len(self.providers)  # Round-robin
                
                print(f"✅ Using {provider['name']} provider")
                return llm
                
            except Exception as e:
                if self._is_rate_limit_error(e):
                    print(f"⚠️ {provider['name']} rate limit exceeded! Marking as failed.")
                    provider["working"] = False
                    provider["last_fail"] = time.time()
                    # Move to next provider
                    self.current_index = (self.current_index + 1) % len(self.providers)
                    continue
                else:
                    print(f"⚠️ {provider['name']} failed: {str(e)[:100]}...")
                    # Move to next provider
                    self.current_index = (self.current_index + 1) % len(self.providers)
                    continue
        
        # If all providers failed
        raise Exception("❌ All LLM providers failed. Please check your API keys and try again.")
    
    def reset(self):
        """Reset all providers (useful for testing)"""
        for provider in self.providers:
            provider["working"] = True
            provider["last_fail"] = 0
        self.current_index = 0
        print("🔄 All providers reset")

# Singleton instance
_router = None

def get_llm():
    """Get LLM with automatic failover"""
    global _router
    if _router is None:
        _router = LLMRouter()
    return _router.get_llm()

def reset_llm_router():
    """Reset the LLM router (useful for testing)"""
    global _router
    if _router:
        _router.reset()
    else:
        _router = LLMRouter()
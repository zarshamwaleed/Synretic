from fastapi import APIRouter, Depends, HTTPException
from backend.api.models import ChatRequest, ChatResponse
from backend.api.dependencies import get_supervisor
from backend.agents.supervisor_graph import SupervisorGraph

router = APIRouter(prefix="/api/chat", tags=["Chat"])

@router.post("/", response_model=ChatResponse)
async def process_chat(
    request: ChatRequest,
    supervisor: SupervisorGraph = Depends(get_supervisor)
):
    """
    Process a chat message through the supervisor agent.
    
    - **query**: User's message
    - **user_id**: User identifier
    - **thread_id**: Optional conversation thread ID
    """
    try:
        result = supervisor.process(
            query=request.query,
            user_id=request.user_id,
            thread_id=request.thread_id
        )
        
        return ChatResponse(
            success=result.get("success", False),
            response=result.get("response", "No response"),
            agent_used=result.get("agent_used", "unknown"),
            products_found=result.get("products_found", 0),
            error=result.get("error")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
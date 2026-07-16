from typing import Optional
from backend.agents.supervisor_graph import SupervisorGraph
from backend.database.models import SessionLocal, Product, Order, User

# Initialize Supervisor (singleton)
_supervisor: Optional[SupervisorGraph] = None

def get_supervisor() -> SupervisorGraph:
    """Get or create Supervisor instance"""
    global _supervisor
    if _supervisor is None:
        _supervisor = SupervisorGraph(use_checkpointing=False)
    return _supervisor

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
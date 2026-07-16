from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List  # ← Added List here
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone
import hashlib
import secrets

from backend.api.dependencies import get_db
from backend.database.models import User

router = APIRouter(prefix="/api/user", tags=["User"])

# Request/Response Models
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    preferences: dict
    created_at: datetime

class AuthResponse(BaseModel):
    success: bool
    message: str
    user: Optional[UserResponse] = None
    token: Optional[str] = None

# Helper functions
def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    return salt + ":" + hashlib.sha256((salt + password).encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    salt, hash_value = hashed.split(":")
    return hash_value == hashlib.sha256((salt + password).encode()).hexdigest()

@router.post("/signup", response_model=AuthResponse)
async def signup(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Register a new user"""
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hashed_password,
        role="customer",  # Default role for new users
        preferences={"currency": "USD", "language": "en"},
        purchase_history=[],
        created_at=datetime.now(timezone.utc)
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate simple token (for demo)
    token = secrets.token_hex(32)
    
    return AuthResponse(
        success=True,
        message="User created successfully",
        user=UserResponse(
            id=new_user.id,
            name=new_user.name,
            email=new_user.email,
            role=new_user.role or "customer",
            preferences=new_user.preferences or {},
            created_at=new_user.created_at
        ),
        token=token
    )

@router.post("/login", response_model=AuthResponse)
async def login(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """Login user"""
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Generate token
    token = secrets.token_hex(32)
    
    return AuthResponse(
        success=True,
        message="Login successful",
        user=UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role or "customer",
            preferences=user.preferences or {},
            created_at=user.created_at
        ),
        token=token
    )

@router.get("/{user_id}", response_model=UserResponse)
async def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get user profile by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role or "customer",
        preferences=user.preferences or {},
        created_at=user.created_at
    )

@router.get("/", response_model=List[UserResponse])
async def get_all_users(
    db: Session = Depends(get_db)
):
    """Get all users (owner only)"""
    users = db.query(User).all()
    return [
        UserResponse(
            id=u.id,
            name=u.name,
            email=u.email,
            role=u.role or "customer",
            preferences=u.preferences or {},
            created_at=u.created_at
        )
        for u in users
    ]

@router.put("/{user_id}")
async def update_user_preferences(
    user_id: int,
    preferences: dict,
    db: Session = Depends(get_db)
):
    """Update user preferences"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.preferences = preferences
    db.commit()
    
    return {"message": "Preferences updated successfully"}
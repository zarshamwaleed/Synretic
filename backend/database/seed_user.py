import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models import SessionLocal, User
from datetime import datetime, timezone

def seed_user():
    db = SessionLocal()
    
    # Check if user exists
    user = db.query(User).filter(User.id == 1).first()
    if user:
        print(f"✅ User already exists: {user.name}")
        db.close()
        return
    
    # Create user
    new_user = User(
        id=1,
        name="John Doe",
        email="john@example.com",
        preferences={"currency": "USD", "language": "en"},
        purchase_history=[],
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_user)
    db.commit()
    db.close()
    
    print("✅ User created successfully!")

if __name__ == "__main__":
    seed_user()
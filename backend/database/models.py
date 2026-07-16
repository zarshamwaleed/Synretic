import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, JSON, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timezone
import os as os_module
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    email = Column(String(100), unique=True)
    password_hash = Column(String(255), nullable=False)  # Make required
    role = Column(String(50), default='customer')  # 'owner' or 'customer'
    preferences = Column(JSON, default={})
    purchase_history = Column(JSON, default=[])
    browsing_history = Column(JSON, default=[])
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
class Product(Base):
    __tablename__ = 'products'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(200))
    description = Column(Text)
    category = Column(String(100))
    price = Column(Float)
    stock = Column(Integer)
    brand = Column(String(100))
    size = Column(String(20))
    color = Column(String(50))
    variations = Column(JSON, default=[])  # NEW: Store all variations
    image = Column(String(255), nullable=True)  # NEW: Product image
    embedding_id = Column(String(100))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
class Order(Base):
    __tablename__ = 'orders'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    product_id = Column(Integer)
    quantity = Column(Integer)
    total_amount = Column(Float)
    status = Column(String(50), default='pending')
    payment_status = Column(String(50), default='pending')
    payment_attempts = Column(Integer, default=0)
    order_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    shipping_address = Column(JSON, nullable=True)
    tracking_number = Column(String(100), nullable=True)
    
class Checkpoint(Base):
    __tablename__ = 'checkpoints'
    
    id = Column(Integer, primary_key=True)
    thread_id = Column(String(100), unique=True)
    checkpoint_data = Column(JSON)
    user_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
class Conversation(Base):
    __tablename__ = 'conversations'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    thread_id = Column(String(100))
    message = Column(Text)
    response = Column(Text)
    agent_used = Column(String(50))
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

# Database connection setup
DATABASE_URL = os_module.getenv('DATABASE_URL')
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in .env file")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def create_tables():
    """Create all tables in the database"""
    Base.metadata.create_all(engine)
    print("✅ Tables created successfully!")

if __name__ == "__main__":
    create_tables()
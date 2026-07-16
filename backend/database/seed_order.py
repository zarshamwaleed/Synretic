import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models import SessionLocal, Order, User, Product
from datetime import datetime, timezone

def seed_orders():
    print("🌱 Seeding orders...")
    db = SessionLocal()
    
    # Check if user exists
    user = db.query(User).filter(User.id == 1).first()
    if not user:
        print("❌ User not found! Run seed_user.py first.")
        db.close()
        return
    
    # Check if orders already exist
    existing_orders = db.query(Order).filter(Order.user_id == 1).all()
    if existing_orders:
        print(f"✅ {len(existing_orders)} orders already exist")
        db.close()
        return
    
    # Create sample orders using actual product IDs
    orders_data = [
        {
            "product_id": 49,  # Nike Air Zoom Pegasus
            "quantity": 1,
            "total_amount": 120.00,
            "status": "delivered",
            "payment_status": "completed",
            "payment_attempts": 1,
            "tracking_number": "TRK-001-DEL"
        },
        {
            "product_id": 51,  # Adidas Ultraboost 22
            "quantity": 2,
            "total_amount": 320.00,
            "status": "shipped",
            "payment_status": "completed",
            "payment_attempts": 1,
            "tracking_number": "TRK-002-SHP"
        },
        {
            "product_id": 53,  # Nike Air Jordan 1
            "quantity": 1,
            "total_amount": 180.00,
            "status": "pending",
            "payment_status": "pending",
            "payment_attempts": 0,
            "tracking_number": None
        },
        {
            "product_id": 55,  # New Balance 574
            "quantity": 1,
            "total_amount": 90.00,
            "status": "paid",
            "payment_status": "completed",
            "payment_attempts": 1,
            "tracking_number": "TRK-004-PAID"
        }
    ]
    
    for order_data in orders_data:
        order = Order(
            user_id=1,
            product_id=order_data["product_id"],
            quantity=order_data["quantity"],
            total_amount=order_data["total_amount"],
            status=order_data["status"],
            payment_status=order_data["payment_status"],
            payment_attempts=order_data["payment_attempts"],
            order_date=datetime.now(timezone.utc),
            tracking_number=order_data["tracking_number"],
            shipping_address={
                "street": "123 Main St",
                "city": "New York",
                "state": "NY",
                "zip": "10001",
                "country": "USA"
            }
        )
        db.add(order)
        print(f"✅ Created order for product {order_data['product_id']} ({order_data['status']})")
    
    db.commit()
    db.close()
    print("✅ Orders seeded successfully!")

if __name__ == "__main__":
    seed_orders()
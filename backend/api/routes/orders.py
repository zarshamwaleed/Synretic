from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from backend.api.models import OrderRequest, OrderResponse
from backend.api.dependencies import get_db
from backend.database.models import Order, Product, User

router = APIRouter(prefix="/api/orders", tags=["Orders"])

# ============ CREATE Order ============
@router.post("/", response_model=OrderResponse)
async def create_order(
    request: OrderRequest,
    db: Session = Depends(get_db)
):
    """Create a new order"""
    # Check if product exists and has stock
    product = db.query(Product).filter(Product.id == request.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.stock < request.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    # Check if user exists
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create order
    total_amount = product.price * request.quantity
    order = Order(
        user_id=request.user_id,
        product_id=request.product_id,
        quantity=request.quantity,
        total_amount=total_amount,
        status="pending",
        payment_status="pending",
        shipping_address=request.shipping_address,
        order_date=datetime.now(timezone.utc)
    )
    
    # Reduce stock
    product.stock -= request.quantity
    
    db.add(order)
    db.commit()
    db.refresh(order)
    
    return OrderResponse(
        order_id=order.id,
        user_id=order.user_id,
        product_id=order.product_id,
        quantity=order.quantity,
        total_amount=order.total_amount,
        status=order.status,
        payment_status=order.payment_status,
        order_date=order.order_date,
        tracking_number=order.tracking_number
    )

# ============ GET Orders by User ============
@router.get("/", response_model=List[OrderResponse])
async def list_orders(
    user_id: int,
    db: Session = Depends(get_db)
):
    """List all orders for a user"""
    orders = db.query(Order).filter(Order.user_id == user_id).all()
    
    return [
        OrderResponse(
            order_id=o.id,
            user_id=o.user_id,
            product_id=o.product_id,
            quantity=o.quantity,
            total_amount=o.total_amount,
            status=o.status,
            payment_status=o.payment_status,
            order_date=o.order_date,
            tracking_number=o.tracking_number
        )
        for o in orders
    ]

# ============ GET All Orders (Owner Only) ============
@router.get("/all", response_model=List[OrderResponse])
async def get_all_orders(
    db: Session = Depends(get_db)
):
    """Get all orders (owner only)"""
    orders = db.query(Order).order_by(Order.order_date.desc()).all()
    return [
        OrderResponse(
            order_id=o.id,
            user_id=o.user_id,
            product_id=o.product_id,
            quantity=o.quantity,
            total_amount=o.total_amount,
            status=o.status,
            payment_status=o.payment_status,
            order_date=o.order_date,
            tracking_number=o.tracking_number
        )
        for o in orders
    ]

# ============ GET Single Order ============
@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific order by ID"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return OrderResponse(
        order_id=order.id,
        user_id=order.user_id,
        product_id=order.product_id,
        quantity=order.quantity,
        total_amount=order.total_amount,
        status=order.status,
        payment_status=order.payment_status,
        order_date=order.order_date,
        tracking_number=order.tracking_number
    )
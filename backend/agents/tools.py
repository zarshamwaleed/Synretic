from typing import List, Dict, Any, Optional
from langchain_core.tools import tool
import json
import warnings
import sys
import os
warnings.filterwarnings("ignore")

# Fix imports to work from any location
try:
    from backend.database.models import Product, Order, User, SessionLocal
    from backend.database.chroma_setup import ChromaDBManager
except ImportError:
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from database.models import Product, Order, User, SessionLocal
    from database.chroma_setup import ChromaDBManager

# Initialize ChromaDB
try:
    chroma = ChromaDBManager()
except Exception as e:
    print(f"⚠️ Warning: Could not initialize ChromaDB: {e}")
    chroma = None

# ============ Core Functions (for direct use) ============

def search_products_func(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Core search function - returns list of products"""
    try:
        if chroma is None:
            return [{'error': 'ChromaDB not initialized'}]
        
        query = str(query) if query else "shoes"
        results = chroma.search_similar(query, n_results=limit)
        
        products = []
        if results and results.get('documents') and len(results['documents'][0]) > 0:
            # Get product IDs to fetch full details from PostgreSQL
            product_ids = []
            for metadata in results['metadatas'][0]:
                product_id = metadata.get('product_id')
                if product_id:
                    try:
                        product_ids.append(int(product_id))
                    except:
                        pass
            
            # Fetch full product details from PostgreSQL
            db = SessionLocal()
            db_products = db.query(Product).filter(Product.id.in_(product_ids)).all()
            db.close()
            
            # Create a map of product_id -> product
            product_map = {p.id: p for p in db_products}
            
            for doc, metadata, distance in zip(
                results['documents'][0],
                results['metadatas'][0],
                results['distances'][0]
            ):
                product_id = metadata.get('product_id')
                product = product_map.get(int(product_id)) if product_id else None
                
                if product:
                    products.append({
                        'id': product.id,
                        'name': product.name,
                        'brand': product.brand,
                        'category': product.category,
                        'price': product.price,
                        'stock': product.stock,
                        'size': product.size,
                        'color': product.color,
                        'description': product.description[:150] + "..." if len(product.description) > 150 else product.description,
                        'similarity_score': round(1 - distance, 3)
                    })
                else:
                    # Fallback to metadata
                    products.append({
                        'id': metadata.get('product_id', 'N/A'),
                        'name': metadata.get('name', 'N/A'),
                        'brand': metadata.get('brand', 'N/A'),
                        'category': metadata.get('category', 'N/A'),
                        'price': 'N/A',
                        'stock': 'N/A',
                        'size': metadata.get('size', 'N/A'),
                        'color': metadata.get('color', 'N/A'),
                        'description': doc[:150] + "...",
                        'similarity_score': round(1 - distance, 3)
                    })
        return products
    except Exception as e:
        return [{'error': f"Search failed: {str(e)}"}]

def get_product_by_id_func(product_id: int) -> Optional[Dict[str, Any]]:
    """Core get product function"""
    try:
        db = SessionLocal()
        product = db.query(Product).filter(Product.id == product_id).first()
        db.close()
        
        if product:
            return {
                'id': product.id,
                'name': product.name,
                'description': product.description,
                'category': product.category,
                'price': product.price,
                'stock': product.stock,
                'brand': product.brand,
                'size': product.size,
                'color': product.color
            }
        return None
    except Exception as e:
        return {'error': f"Failed to get product: {str(e)}"}

def get_user_history_func(user_id: int) -> Dict[str, Any]:
    """Core get user history function"""
    try:
        db = SessionLocal()
        user = db.query(User).filter(User.id == user_id).first()
        db.close()
        
        if user:
            return {
                'name': user.name,
                'email': user.email,
                'purchase_history': user.purchase_history or [],
                'browsing_history': user.browsing_history or [],
                'preferences': user.preferences or {}
            }
        return {'error': 'User not found'}
    except Exception as e:
        return {'error': f"Failed to get user history: {str(e)}"}

def check_stock_func(product_id: int, quantity: int = 1) -> Dict[str, Any]:
    """Core check stock function"""
    try:
        db = SessionLocal()
        product = db.query(Product).filter(Product.id == product_id).first()
        db.close()
        
        if product:
            available = product.stock >= quantity
            return {
                'product_id': product.id,
                'product_name': product.name,
                'stock': product.stock,
                'requested': quantity,
                'available': available,
                'message': f"{'✅ In stock' if available else '❌ Out of stock'}"
            }
        return {'error': 'Product not found'}
    except Exception as e:
        return {'error': f"Failed to check stock: {str(e)}"}

def update_inventory_func(product_id: int, quantity_change: int) -> Dict[str, Any]:
    """Core update inventory function"""
    try:
        db = SessionLocal()
        product = db.query(Product).filter(Product.id == product_id).first()
        
        if product:
            new_stock = product.stock + quantity_change
            if new_stock < 0:
                db.close()
                return {'error': 'Insufficient stock'}
            
            product.stock = new_stock
            db.commit()
            db.close()
            
            return {
                'product_id': product.id,
                'product_name': product.name,
                'new_stock': new_stock,
                'message': f"✅ Inventory updated successfully"
            }
        db.close()
        return {'error': 'Product not found'}
    except Exception as e:
        return {'error': f"Failed to update inventory: {str(e)}"}

def process_payment_func(user_id: int, order_id: int, amount: float) -> Dict[str, Any]:
    """Core payment processing function"""
    import random
    import time
    
    max_attempts = 3
    attempts = 0
    
    while attempts < max_attempts:
        attempts += 1
        time.sleep(0.5)
        
        # 80% success rate
        success = random.random() < 0.8
        
        if success:
            db = SessionLocal()
            order = db.query(Order).filter(Order.id == order_id).first()
            if order:
                order.payment_status = 'completed'
                order.status = 'paid'
                order.payment_attempts = attempts
                db.commit()
                db.close()
                
                return {
                    'success': True,
                    'order_id': order_id,
                    'amount': amount,
                    'attempts': attempts,
                    'message': f"✅ Payment successful after {attempts} attempt(s)"
                }
            db.close()
            return {'error': 'Order not found'}
        
        if attempts < max_attempts:
            time.sleep(1)
    
    # All attempts failed
    db = SessionLocal()
    order = db.query(Order).filter(Order.id == order_id).first()
    if order:
        order.payment_status = 'failed'
        order.payment_attempts = attempts
        db.commit()
        db.close()
    
    return {
        'success': False,
        'order_id': order_id,
        'amount': amount,
        'attempts': attempts,
        'message': f"❌ Payment failed after {attempts} attempts"
    }

def refund_payment_func(order_id: int) -> Dict[str, Any]:
    """Core refund function"""
    try:
        db = SessionLocal()
        order = db.query(Order).filter(Order.id == order_id).first()
        
        if order:
            order.payment_status = 'refunded'
            order.status = 'refunded'
            db.commit()
            db.close()
            
            return {
                'success': True,
                'order_id': order_id,
                'message': f"✅ Refund processed successfully"
            }
        db.close()
        return {'error': 'Order not found'}
    except Exception as e:
        return {'error': f"Failed to process refund: {str(e)}"}

def track_order_func(order_id: int) -> Dict[str, Any]:
    """Core track order function"""
    try:
        db = SessionLocal()
        order = db.query(Order).filter(Order.id == order_id).first()
        db.close()
        
        if order:
            status_messages = {
                'pending': '⏳ Order is being processed',
                'paid': '✅ Payment confirmed, preparing for shipment',
                'shipped': '📦 Order has been shipped',
                'delivered': '📬 Order has been delivered',
                'refunded': '💰 Order has been refunded'
            }
            
            return {
                'order_id': order.id,
                'status': order.status,
                'message': status_messages.get(order.status, 'Status unknown'),
                'tracking_number': order.tracking_number or 'Not available',
                'order_date': order.order_date.isoformat()
            }
        return {'error': 'Order not found'}
    except Exception as e:
        return {'error': f"Failed to track order: {str(e)}"}

def process_return_func(order_id: int, reason: str) -> Dict[str, Any]:
    """Core process return function"""
    try:
        db = SessionLocal()
        order = db.query(Order).filter(Order.id == order_id).first()
        
        if order:
            if order.status in ['delivered', 'shipped']:
                order.status = 'returned'
                db.commit()
                db.close()
                
                return {
                    'success': True,
                    'order_id': order_id,
                    'reason': reason,
                    'message': f"✅ Return request approved for order #{order_id}"
                }
            else:
                db.close()
                return {
                    'success': False,
                    'message': f"❌ Order #{order_id} cannot be returned (Status: {order.status})"
                }
        db.close()
        return {'error': 'Order not found'}
    except Exception as e:
        return {'error': f"Failed to process return: {str(e)}"}

# ============ LangChain Tools (for agent use) ============

@tool
def search_products(query: str, limit: int = 5) -> str:
    """Search for products using vector similarity. Returns product list as JSON."""
    results = search_products_func(query, limit)
    return json.dumps(results)

@tool
def get_product_by_id(product_id: int) -> str:
    """Get product details by ID from PostgreSQL. Returns JSON."""
    # Ensure product_id is an integer
    try:
        product_id = int(product_id)
    except:
        return json.dumps({'error': 'Invalid product ID'})
    
    result = get_product_by_id_func(product_id)
    return json.dumps(result)

@tool
def get_user_history(user_id: int) -> str:
    """Get user's purchase and browsing history. Returns JSON."""
    result = get_user_history_func(user_id)
    return json.dumps(result)

@tool
def check_stock(product_id: int, quantity: int = 1) -> str:
    """Check if a product is in stock. Returns JSON."""
    result = check_stock_func(product_id, quantity)
    return json.dumps(result)

@tool
def update_inventory(product_id: int, quantity_change: int) -> str:
    """Update product inventory (positive = add, negative = remove). Returns JSON."""
    result = update_inventory_func(product_id, quantity_change)
    return json.dumps(result)

@tool
def process_payment(user_id: int, order_id: int, amount: float) -> str:
    """Process payment with retry logic. Returns JSON."""
    result = process_payment_func(user_id, order_id, amount)
    return json.dumps(result)

@tool
def refund_payment(order_id: int) -> str:
    """Process refund for an order. Returns JSON."""
    result = refund_payment_func(order_id)
    return json.dumps(result)

@tool
def track_order(order_id: int) -> str:
    """Track order status. Returns JSON."""
    result = track_order_func(order_id)
    return json.dumps(result)

@tool
def process_return(order_id: int, reason: str) -> str:
    """Process a return request. Returns JSON."""
    result = process_return_func(order_id, reason)
    return json.dumps(result)

# ============ Exports ============

__all__ = [
    # Core functions (for direct use)
    'search_products_func',
    'get_product_by_id_func',
    'get_user_history_func',
    'check_stock_func',
    'update_inventory_func',
    'process_payment_func',
    'refund_payment_func',
    'track_order_func',
    'process_return_func',
    # LangChain tools (for agent use)
    'search_products',
    'get_product_by_id',
    'get_user_history',
    'check_stock',
    'update_inventory',
    'process_payment',
    'refund_payment',
    'track_order',
    'process_return'
]
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models import SessionLocal, Product
from chroma_setup import ChromaDBManager
from datetime import datetime, timezone
import json

def seed_products():
    print("🌱 Seeding products...")
    print(f"📁 Current working directory: {os.getcwd()}")
    
    # Sample products with variations
    products = [
        {
            "name": "Nike Air Zoom Pegasus",
            "description": "Lightweight running shoes with responsive cushioning for daily runs",
            "category": "Running Shoes",
            "brand": "Nike",
            "price": 120.00,
            "variations": [
                {"size": "9", "color": "Black", "stock": 15},
                {"size": "10", "color": "White", "stock": 10},
                {"size": "11", "color": "Black", "stock": 8}
            ],
            "image": "/products/nike-zoom-pegasus.jpg"
        },
        {
            "name": "Adidas Ultraboost 22",
            "description": "Energy-returning running shoes with adaptive fit and boost technology",
            "category": "Running Shoes",
            "brand": "Adidas",
            "price": 160.00,
            "variations": [
                {"size": "9", "color": "Black", "stock": 8},
                {"size": "11", "color": "Blue", "stock": 6}
            ],
            "image": "/products/adidas-ultraboost.jpg"
        },
        {
            "name": "Nike Air Jordan 1",
            "description": "Classic basketball sneakers with premium leather and iconic design",
            "category": "Basketball Shoes",
            "brand": "Nike",
            "price": 180.00,
            "variations": [
                {"size": "9", "color": "Red/Black", "stock": 5}
            ],
            "image": "/products/nike-jordan.jpg"
        },
        {
            "name": "Puma RS-X",
            "description": "Retro-inspired chunky sneakers with bold design and comfort",
            "category": "Lifestyle Shoes",
            "brand": "Puma",
            "price": 110.00,
            "variations": [
                {"size": "8", "color": "White", "stock": 12}
            ],
            "image": "/products/puma-rsx.jpg"
        },
        {
            "name": "New Balance 574",
            "description": "Classic casual sneakers with ENCAP midsole for all-day comfort",
            "category": "Lifestyle Shoes",
            "brand": "New Balance",
            "price": 90.00,
            "variations": [
                {"size": "9", "color": "Grey", "stock": 20},
                {"size": "10", "color": "Navy", "stock": 15}
            ],
            "image": "/products/new-balance-574.jpg"
        },
        {
            "name": "Asics Gel-Kayano 30",
            "description": "Premium stability running shoes with gel cushioning system",
            "category": "Running Shoes",
            "brand": "Asics",
            "price": 150.00,
            "variations": [
                {"size": "10", "color": "Blue", "stock": 7}
            ],
            "image": "/products/asics-kayano.jpg"
        },
        {
            "name": "Converse Chuck Taylor",
            "description": "Iconic canvas sneakers with rubber toe cap and classic style",
            "category": "Casual Shoes",
            "brand": "Converse",
            "price": 65.00,
            "variations": [
                {"size": "9", "color": "Black", "stock": 25},
                {"size": "7", "color": "White", "stock": 20}
            ],
            "image": "/products/converse-chuck.jpg"
        },
        {
            "name": "Vans Old Skool",
            "description": "Classic skate shoes with signature side stripe and durable construction",
            "category": "Skate Shoes",
            "brand": "Vans",
            "price": 75.00,
            "variations": [
                {"size": "8", "color": "Black/White", "stock": 18}
            ],
            "image": "/products/vans-old-skool.jpg"
        }
    ]
    
    # Setup databases
    print("📊 Connecting to databases...")
    chroma = ChromaDBManager()
    db = SessionLocal()
    
    # Clear existing products
    print("🧹 Clearing existing products...")
    db.query(Product).delete()
    db.commit()
    
    # Clear ChromaDB
    print("🧹 Clearing ChromaDB...")
    chroma.clear_collection()
    
    # Add products
    print(f"📦 Adding {len(products)} products...")
    for i, product_data in enumerate(products, 1):
        # Store variations as JSON
        variations_json = json.dumps(product_data["variations"])
        
        # Get first variation for base price/stock
        first_variation = product_data["variations"][0]
        
        product = Product(
            name=product_data["name"],
            description=product_data["description"],
            category=product_data["category"],
            price=product_data["price"],
            stock=first_variation["stock"],
            brand=product_data["brand"],
            size=first_variation["size"],
            color=first_variation["color"],
            variations=variations_json,  # Store all variations
            image=product_data.get("image", ""),
            embedding_id=f"product_{i}",
            created_at=datetime.now(timezone.utc)
        )
        db.add(product)
        
        # Add to ChromaDB (use combined info)
        search_text = f"{product_data['name']} {product_data['description']} {product_data['category']} {product_data['brand']}"
        chroma.add_product(
            product_id=i,
            name=product_data["name"],
            description=product_data["description"],
            category=product_data["category"],
            brand=product_data["brand"],
            size="",  # Not used for search
            color=""   # Not used for search
        )
        
        print(f"✅ Added product: {product_data['name']} (ID: {i})")
    
    db.commit()
    db.close()
    
    print(f"\n✅ Seeded {len(products)} products into PostgreSQL and ChromaDB")

if __name__ == "__main__":
    seed_products()
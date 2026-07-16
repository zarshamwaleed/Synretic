from fastapi import APIRouter, Depends, Query, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
import json  # ← ADD THIS IMPORT
from datetime import datetime
from backend.api.models import ProductResponse
from backend.api.dependencies import get_db
from backend.database.models import Product
from backend.database.chroma_setup import ChromaDBManager

router = APIRouter(prefix="/api/products", tags=["Products"])

# Image upload directory
UPLOAD_DIR = "frontend/public/products"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Initialize ChromaDB
chroma = ChromaDBManager()

@router.get("/", response_model=List[ProductResponse])
async def list_products(
    category: Optional[str] = Query(None),
    brand: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    limit: int = Query(20),
    offset: int = Query(0),
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    if category:
        query = query.filter(Product.category == category)
    if brand:
        query = query.filter(Product.brand == brand)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    products = query.offset(offset).limit(limit).all()
    return [
        ProductResponse(
            id=p.id,
            name=p.name,
            description=p.description,
            category=p.category,
            price=p.price,
            stock=p.stock,
            brand=p.brand,
            size=p.size,
            color=p.color,
            image=p.image,
            variations=json.loads(p.variations) if p.variations else []  # ← PARSE JSON
        )
        for p in products
    ]

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductResponse(
        id=product.id,
        name=product.name,
        description=product.description,
        category=product.category,
        price=product.price,
        stock=product.stock,
        brand=product.brand,
        size=product.size,
        color=product.color,
        image=product.image,
        variations=json.loads(product.variations) if product.variations else []  # ← PARSE JSON
    )

# ============ CREATE PRODUCT ============
@router.post("/")
async def create_product(
    name: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    price: float = Form(...),
    stock: int = Form(...),
    brand: str = Form(...),
    size: str = Form(...),
    color: str = Form(...),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    try:
        image_path = None
        if image and image.filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            file_extension = os.path.splitext(image.filename)[1]
            filename = f"{timestamp}{file_extension}"
            filepath = os.path.join(UPLOAD_DIR, filename)
            with open(filepath, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            image_path = f"/products/{filename}"

        # Create variations as JSON string
        variations_json = json.dumps([{"size": size, "color": color, "stock": stock}])

        new_product = Product(
            name=name,
            description=description,
            category=category,
            price=price,
            stock=stock,
            brand=brand,
            size=size,
            color=color,
            image=image_path,
            variations=variations_json  # Store as JSON string
        )
        db.add(new_product)
        db.commit()
        db.refresh(new_product)
        
        # Add to ChromaDB
        try:
            chroma.add_product(
                product_id=new_product.id,
                name=name,
                description=description,
                category=category,
                brand=brand,
                size=size,
                color=color
            )
            print(f"✅ Added to ChromaDB: {name} (ID: {new_product.id})")
        except Exception as e:
            print(f"⚠️ ChromaDB error: {e}")
        
        return ProductResponse(
            id=new_product.id,
            name=new_product.name,
            description=new_product.description,
            category=new_product.category,
            price=new_product.price,
            stock=new_product.stock,
            brand=new_product.brand,
            size=new_product.size,
            color=new_product.color,
            image=new_product.image,
            variations=json.loads(new_product.variations) if new_product.variations else []
        )
    except Exception as e:
        print(f"Error creating product: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ UPDATE PRODUCT ============
@router.put("/{product_id}")
async def update_product(
    product_id: int,
    name: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    price: float = Form(...),
    stock: int = Form(...),
    brand: str = Form(...),
    size: str = Form(...),
    color: str = Form(...),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    try:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Update fields
        product.name = name
        product.description = description
        product.category = category
        product.price = price
        product.stock = stock
        product.brand = brand
        product.size = size
        product.color = color
        
        # Update variations
        product.variations = json.dumps([{"size": size, "color": color, "stock": stock}])
        
        # Update image if uploaded
        if image and image.filename:
            if product.image:
                old_path = os.path.join(UPLOAD_DIR, os.path.basename(product.image))
                if os.path.exists(old_path):
                    os.remove(old_path)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            file_extension = os.path.splitext(image.filename)[1]
            filename = f"{timestamp}{file_extension}"
            filepath = os.path.join(UPLOAD_DIR, filename)
            with open(filepath, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            product.image = f"/products/{filename}"
        
        db.commit()
        db.refresh(product)
        
        # Update ChromaDB
        try:
            try:
                chroma.delete_product(product_id)
            except:
                pass
            chroma.add_product(
                product_id=product.id,
                name=name,
                description=description,
                category=category,
                brand=brand,
                size=size,
                color=color
            )
            print(f"✅ Updated ChromaDB: {name} (ID: {product.id})")
        except Exception as e:
            print(f"⚠️ ChromaDB error: {e}")
        
        return ProductResponse(
            id=product.id,
            name=product.name,
            description=product.description,
            category=product.category,
            price=product.price,
            stock=product.stock,
            brand=product.brand,
            size=product.size,
            color=product.color,
            image=product.image,
            variations=json.loads(product.variations) if product.variations else []
        )
    except Exception as e:
        print(f"Error updating product: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ DELETE PRODUCT ============
@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.image:
        old_path = os.path.join(UPLOAD_DIR, os.path.basename(product.image))
        if os.path.exists(old_path):
            os.remove(old_path)
    
    try:
        chroma.delete_product(product_id)
        print(f"✅ Deleted from ChromaDB: {product.name} (ID: {product_id})")
    except Exception as e:
        print(f"⚠️ ChromaDB error: {e}")
    
    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}
from backend.database.models import SessionLocal, Product

db = SessionLocal()
products = db.query(Product).filter(Product.name.ilike('%samb%')).all()

print("\n📦 Samba in PostgreSQL:")
print("-" * 40)

if products:
    for p in products:
        print(f"ID: {p.id}, Name: '{p.name}', Brand: '{p.brand}'")
        print(f"  Description: {p.description[:50]}...")
else:
    print("❌ No Samba product found")

db.close()
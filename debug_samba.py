from backend.database.chroma_setup import ChromaDBManager
from backend.database.models import SessionLocal, Product

def debug_samba():
    print("🔍 Debugging Samba Search\n" + "="*50)
    
    # 1. Check PostgreSQL
    print("\n📦 1. Checking PostgreSQL:")
    db = SessionLocal()
    products = db.query(Product).filter(Product.name.ilike('%samb%')).all()
    if products:
        for p in products:
            print(f"   ID: {p.id}, Name: '{p.name}', Brand: '{p.brand}'")
    else:
        print("   ❌ No Samba product in PostgreSQL")
    db.close()
    
    # 2. Check ChromaDB
    print("\n🔍 2. Checking ChromaDB for 'samba':")
    c = ChromaDBManager()
    results = c.search_similar('samba', n_results=5)
    
    if results and results.get('documents') and results['documents'][0]:
        print(f"   Found {len(results['documents'][0])} results:")
        for i, (doc, meta) in enumerate(zip(results['documents'][0], results['metadatas'][0])):
            name = meta.get('name', 'Unknown')
            brand = meta.get('brand', 'Unknown')
            print(f"   {i+1}. {name} - {brand}")
    else:
        print("   ❌ No results found for 'samba'")
    
    # 3. Show all products in ChromaDB
    print("\n📋 3. All products in ChromaDB:")
    all_data = c.collection.get()
    for i, meta in enumerate(all_data['metadatas']):
        name = meta.get('name', 'Unknown')
        brand = meta.get('brand', 'Unknown')
        print(f"   {i+1}. {name} - {brand}")

if __name__ == "__main__":
    debug_samba()
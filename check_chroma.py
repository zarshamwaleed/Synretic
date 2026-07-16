from backend.database.chroma_setup import ChromaDBManager

def check_chroma():
    print("🔍 Checking ChromaDB...\n")
    
    c = ChromaDBManager()
    data = c.collection.get()
    
    print(f"📊 Total products in ChromaDB: {len(data['ids'])}\n")
    print("📋 All products:")
    print("-" * 50)
    
    for i, meta in enumerate(data['metadatas']):
        name = meta.get("name", "Unknown")
        brand = meta.get("brand", "Unknown")
        print(f"{i+1}. {name} - {brand}")
    
    # Check if Samba exists
    print("\n" + "=" * 50)
    samba_found = False
    for meta in data['metadatas']:
        if "samba" in meta.get("name", "").lower():
            samba_found = True
            print(f"✅ Found: {meta.get('name')} - {meta.get('brand')}")
    
    if not samba_found:
        print("❌ No Samba product found in ChromaDB")
        print("   Run: python backend/database/seed_data.py to re-seed")

if __name__ == "__main__":
    check_chroma()
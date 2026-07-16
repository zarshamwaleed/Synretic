from backend.database.chroma_setup import ChromaDBManager

c = ChromaDBManager()
data = c.collection.get()

print("\n📋 Products in ChromaDB:")
print("-" * 40)

for i, meta in enumerate(data['metadatas']):
    name = meta.get('name', 'Unknown')
    brand = meta.get('brand', 'Unknown')
    product_id = meta.get('product_id', 'N/A')
    print(f"{i+1}. [{product_id}] {name} - {brand}")

print("-" * 40)
print(f"Total: {len(data['ids'])} products")
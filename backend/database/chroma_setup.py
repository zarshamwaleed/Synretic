import chromadb
from chromadb.utils import embedding_functions
import os
import warnings
warnings.filterwarnings("ignore")

class ChromaDBManager:
    def __init__(self, collection_name="products"):
        # Use absolute path to project root
        project_root = r"D:\Synretic"
        persist_dir = os.path.join(project_root, 'chroma_db')
        
        os.makedirs(persist_dir, exist_ok=True)
        
        print(f"📁 ChromaDB path: {persist_dir}")
        
        self.client = chromadb.PersistentClient(path=persist_dir)
        
        try:
            self.embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
                model_name="all-MiniLM-L6-v2"
            )
        except Exception as e:
            print(f"⚠️ Error loading embedding function: {e}")
            self.embedding_fn = None
        
        try:
            self.collection = self.client.get_collection(name=collection_name)
            print(f"✅ Found existing collection: {collection_name} (count: {self.collection.count()})")
        except:
            self.collection = self.client.create_collection(
                name=collection_name,
                embedding_function=self.embedding_fn
            )
            print(f"✅ Created new collection: {collection_name}")
    
    def add_product(self, product_id, name, description, category, brand, size, color):
        """Add a product to the vector database"""
        text = f"{name} {description} {category} {brand} size {size} color {color}"
        
        metadata = {
            "name": name,
            "category": category,
            "brand": brand,
            "size": size,
            "color": color,
            "product_id": str(product_id)
        }
        
        try:
            self.collection.add(
                documents=[text],
                metadatas=[metadata],
                ids=[f"product_{product_id}"]
            )
            return True
        except Exception as e:
            print(f"⚠️ Error adding product {product_id}: {e}")
            return False
    
    def delete_product(self, product_id):
        """Delete a product from ChromaDB"""
        try:
            self.collection.delete(ids=[f"product_{product_id}"])
            return True
        except Exception as e:
            print(f"⚠️ Error deleting product {product_id}: {e}")
            return False
    
    def search_similar(self, query, n_results=5, filters=None):
        """Search for similar products"""
        try:
            query = str(query) if query else "shoes"
            
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results,
                where=filters
            )
            return results
        except Exception as e:
            print(f"⚠️ Search error: {e}")
            return {"documents": [[]], "metadatas": [[]], "distances": [[]]}
    
    def get_all_products(self):
        """Get all products in the collection"""
        return self.collection.get()
    
    def clear_collection(self):
        """Clear all products from collection"""
        try:
            all_ids = self.collection.get()['ids']
            if all_ids:
                self.collection.delete(ids=all_ids)
                print("✅ Collection cleared")
            else:
                print("ℹ️ Collection was already empty")
        except Exception as e:
            print(f"⚠️ Error clearing collection: {e}")

if __name__ == "__main__":
    db = ChromaDBManager()
    print(f"✅ ChromaDB setup successful! Collection count: {db.collection.count()}")
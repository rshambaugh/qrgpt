from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import psycopg2


# Initialize the FastAPI app instance
app = FastAPI()

# Connect to PostgreSQL
conn = psycopg2.connect(
    dbname="qrganizer",
    user="qr_user",
    password="securepassword",
    host="localhost"
)
cursor = conn.cursor()


# Add middleware after initializing the app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change '*' to a specific domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the Item data model
class Item(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    quantity: int
    location: str
    storage_container: Optional[str] = None
    tags: Optional[list[str]] = []

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to QRganizer!"}

# Create an item
@app.post("/items/")
def create_item(item: Item):
    try:
        print(f"Creating item: {item}")  # Debugging log
        cursor.execute(
            """
            INSERT INTO items (name, category, description, quantity, location, storage_container, tags)
            VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id;
            """,
            (item.name, item.category, item.description, item.quantity, 
             item.location, item.storage_container, item.tags)
        )
        conn.commit()
        item_id = cursor.fetchone()
        print("Created Item ID:", item_id)  # Debugging log
        if item_id:
            # Fetch the created item to ensure all fields are returned
            cursor.execute("SELECT * FROM items WHERE id = %s;", (item_id[0],))
            row = cursor.fetchone()
            if row:
                created_item = {
                    "id": row[0],
                    "name": row[1],
                    "category": row[2],
                    "description": row[3],
                    "quantity": row[4],
                    "location": row[5],
                    "storage_container": row[6],
                    "tags": row[7],
                }
                return {"item": created_item}
    except Exception as e:
        print("Error during creation:", e)  # Debugging log
        return {"error": "Server error"}, 500



@app.get("/items/{item_id}")
def get_item(item_id: int):
    cursor.execute("SELECT * FROM items WHERE id = %s;", (item_id,))
    row = cursor.fetchone()
    if row:
        item = {
            "id": row[0],
            "name": row[1],
            "category": row[2],
            "description": row[3],
            "quantity": row[4],
            "location": row[5],
            "storage_container": row[6],
            "tags": row[7],
        }
        return {"item": item}
    return {"error": "Item not found"}, 404

@app.put("/items/{item_id}")
def update_item(item_id: int, item: Item):
    try:
        print(f"Updating item with ID: {item_id}")  # Debugging log
        cursor.execute(
            """
            UPDATE items
            SET name = %s, category = %s, description = %s, quantity = %s, 
                location = %s, storage_container = %s, tags = %s
            WHERE id = %s
            RETURNING id;
            """,
            (
                item.name, item.category, item.description, item.quantity,
                item.location, item.storage_container, item.tags, item_id
            )
        )
        conn.commit()
        updated_item_id = cursor.fetchone()
        print("Updated Item ID:", updated_item_id)  # Debugging log
        if updated_item_id:
            # Fetch the updated item from the database
            cursor.execute("SELECT * FROM items WHERE id = %s;", (item_id,))
            row = cursor.fetchone()
            if row:
                updated_item = {
                    "id": row[0],
                    "name": row[1],
                    "category": row[2],
                    "description": row[3],
                    "quantity": row[4],
                    "location": row[5],
                    "storage_container": row[6],
                    "tags": row[7],
                }
                return {"item": updated_item, "message": "Item updated successfully"}
        return {"error": "Item not found"}, 404
    except Exception as e:
        print("Error during update:", e)  # Debugging log
        return {"error": "Server error"}, 500



@app.delete("/items/{item_id}")
def delete_item(item_id: int):
    cursor.execute(
        "DELETE FROM items WHERE id = %s RETURNING id;",
        (item_id,)
    )
    conn.commit()
    deleted_item_id = cursor.fetchone()
    if deleted_item_id:
        return {"id": deleted_item_id[0], "message": "Item deleted successfully"}
    return {"error": "Item not found"}, 404



@app.get("/items/")
def get_items():
    cursor.execute("SELECT * FROM items;")
    rows = cursor.fetchall()
    items = [
        {
            "id": row[0],
            "name": row[1],
            "category": row[2],
            "description": row[3],
            "quantity": row[4],
            "location": row[5],
            "storage_container": row[6],
            "tags": row[7],
        }
        for row in rows
    ]
    return items

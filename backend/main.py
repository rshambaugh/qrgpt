import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import psycopg2
import qrcode
import io
import base64
from dotenv import load_dotenv
from io import BytesIO
import psycopg2@app.get("/items/")
def get_items():
    try:
        cursor.execute("SELECT * FROM items;")
        rows = cursor.fetchall()
        items = []
        for row in rows:
            items.append({
                "id": row[0],
                "name": row[1],
                "category": row[2],
                "description": row[3],
                "quantity": row[4],
                "location": row[5],
                "storage_container": row[6],
                "tags": row[7],
                "qr_code": row[8],  # Use raw value from the database
            })
        return items
    except Exception as e:
        print(f"Error in get_items: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")



# Load environment variables from the .env file
load_dotenv()

# Initialize the FastAPI app instance
app = FastAPI()

# Use environment variables for the database connection
DB_NAME = os.getenv("DB_NAME", "qrganizer")
DB_USER = os.getenv("DB_USER", "qr_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "securepassword")
DB_HOST = os.getenv("DB_HOST", "localhost")

# Connect to PostgreSQL
conn = psycopg2.connect(
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASSWORD,
    host=DB_HOST
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

class Item(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    quantity: int
    location: str
    storage_container: Optional[int] = None
    tags: Optional[list[str]] = []
    qr_code: Optional[str] = None

# Generage QR Code
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Generate QR Code with base64 prefix. Ensure double prefix does not exist
def generate_qr_code(data: str) -> str:
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_Q, box_size=8, border=4)
    qr.add_data(data)
    qr.make(fit=True)

    # Convert QR code to base64
    img = qr.make_image(fill="black", back_color="white")
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    return f"data:image/png;base64,{base64.b64encode(buffered.getvalue()).decode('utf-8')}"

# Create Item
@app.post("/items/")
def create_item(item: Item):
    try:
        # Generate QR code data
        qr_data = f"Item: {item.name}\nLocation: {item.location}\nContainer: {item.storage_container or 'None'}"
        qr_code_data = generate_qr_code(qr_data)

        # Insert into database
        cursor.execute(
            """
            INSERT INTO items (name, category, description, quantity, location, storage_container, tags, qr_code)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id;
            """,
            (
                item.name,
                item.category,
                item.description,
                item.quantity,
                item.location,
                item.storage_container,
                item.tags,
                qr_code_data,  # Ensure no duplication
            ),
        )
        conn.commit()
        conn.close()


        new_item_id = cursor.fetchone()[0]
        return {"id": new_item_id, "qr_code": qr_code_data}
    except Exception as e:
        conn.rollback()
        print(f"Error creating item: {e}")
        return {"error": f"Server error: {str(e)}"}, 500




#Define the Container model
class Container(BaseModel):
    name: str
    parent_container_id: Optional[int] = None
    location: Optional[str] = None
    tags: Optional[list[str]] = []
    qr_code: Optional[str] = None


# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to QRganizer!"}

# Helper function to check if an item is a container
def check_is_container(item_id: int) -> bool:
    """Check if an item is a container by checking for nested items."""
    cursor.execute("SELECT COUNT(*) FROM items WHERE storage_container = %s;", (item_id,))
    return cursor.fetchone()[0] > 0

# Create Container
@app.post("/containers/")
def create_container(container: Container):
    try:
        # Generate QR code content
        qr_data = f"Container: {container.name}\nLocation: {container.location or 'N/A'}"
        qr_code_data = generate_qr_code(qr_data)

        # Insert the container into the database
        cursor.execute(
            """
            INSERT INTO containers (name, parent_container_id, location, tags, qr_code)
            VALUES (%s, %s, %s, %s, %s) RETURNING id;
            """,
            (container.name, container.parent_container_id, container.location, container.tags, qr_code_data),
        )
        conn.commit()
        conn.close()

        container_id = cursor.fetchone()[0]
        return {"id": container_id, "qr_code": qr_code_data}
    except Exception as e:
        conn.rollback()
        print(f"Error creating container: {e}")
        return {"error": "Server error"}, 500


def fetch_nested_containers(container_id: int):
    """Recursively fetch nested containers."""
    cursor.execute("SELECT * FROM containers WHERE parent_container_id = %s;", (container_id,))
    containers = cursor.fetchall()
    
    nested_containers = []
    for container in containers:
        container_data = {
            "id": container[0],
            "name": container[1],
            "parent_container_id": container[2],
            "location": container[3],
            "tags": container[4],
            "qr_code": container[5],
            "nested_containers": fetch_nested_containers(container[0]),  # Recursive call
        }
        nested_containers.append(container_data)
    
    return nested_containers

@app.get("/containers/{container_id}")
def get_container(container_id: int):
    try:
        # Get container details
        cursor.execute("SELECT * FROM containers WHERE id = %s;", (container_id,))
        container = cursor.fetchone()
        if not container:
            return {"error": "Container not found"}, 404

        container_data = {
            "id": container[0],
            "name": container[1],
            "parent_container_id": container[2],
            "location": container[3],
            "tags": container[4],
            "qr_code": container[5],
        }

        # Get items inside the container
        cursor.execute("SELECT * FROM items WHERE container_id = %s;", (container_id,))
        items = [
            {
                "id": row[0],
                "name": row[1],
                "category": row[2],
                "description": row[3],
                "quantity": row[4],
                "location": row[5],
                "tags": row[7],
                "qr_code": row[8],
            }
            for row in cursor.fetchall()
        ]

        # Fetch all nested containers recursively
        nested_containers = fetch_nested_containers(container_id)

        return {
            "container": container_data,
            "items": items,
            "nested_containers": nested_containers,
        }
    except Exception as e:
        print(f"Error fetching container: {e}")
        return {"error": "Server error"}, 500
    
@app.get("/containers/")
def get_all_containers():
    try:
        cursor.execute("SELECT * FROM containers;")
        containers = [
            {
                "id": row[0],
                "name": row[1],
                "parent_container_id": row[2],
                "location": row[3],
                "tags": row[4],
                "qr_code": row[5],
                "created_at": row[6],
                "updated_at": row[7],
            }
            for row in cursor.fetchall()
        ]
        return containers
    except Exception as e:
        print(f"Error fetching containers: {e}")
        return {"error": "Server error"}, 500


@app.put("/containers/{container_id}")
def update_container(container_id: int, container: Container):
    try:
        cursor.execute(
            """
            UPDATE containers
            SET name = %s, parent_container_id = %s, location = %s, tags = %s, qr_code = %s
            WHERE id = %s RETURNING id;
            """,
            (container.name, container.parent_container_id, container.location, container.tags, container.qr_code, container_id),
        )
        conn.commit()
        conn.close()

        updated_id = cursor.fetchone()
        if updated_id:
            return {"id": updated_id[0], "message": "Container updated successfully"}
        return {"error": "Container not found"}, 404
    except Exception as e:
        conn.rollback()
        print(f"Error updating container: {e}")
        return {"error": "Server error"}, 500

@app.delete("/containers/{container_id}")
def delete_container(container_id: int):
    try:
        cursor.execute("DELETE FROM containers WHERE id = %s RETURNING id;", (container_id,))
        conn.commit()
        conn.close()

        deleted_id = cursor.fetchone()
        if deleted_id:
            return {"id": deleted_id[0], "message": "Container deleted successfully"}
        return {"error": "Container not found"}, 404
    except Exception as e:
        conn.rollback()
        print(f"Error deleting container: {e}")
        return {"error": "Server error"}, 500


# Create an item
@app.post("/items/")
def create_item(item: Item):
    try:
        # Generate QR code content
        qr_data = f"Item: {item.name}\nLocation: {item.location}\nContainer: {item.storage_container or 'None'}"
        qr_code_data = generate_qr_code(qr_data)

        # Insert the item into the database
        cursor.execute(
            """
            INSERT INTO items (name, category, description, quantity, location, storage_container, tags, qr_code)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id;
            """,
            (
                item.name,
                item.category,
                item.description,
                item.quantity,
                item.location,
                item.storage_container,
                item.tags,
                qr_code_data,
            ),
        )
        conn.commit()
        conn.close()

        item_id = cursor.fetchone()[0]
        return {"id": item_id, "qr_code": qr_code_data}
    except Exception as e:
        conn.rollback()
        print(f"Error creating item: {e}")
        return {"error": "Server error"}, 500


# Get a specific item
@app.get("/items/{item_id}")
def get_item(item_id: int):
    try:
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
                "qr_code": row[8],  # Use raw value from the database
            }
            return item
        else:
            raise HTTPException(status_code=404, detail="Item not found")
    except Exception as e:
        print(f"Error in get_item: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")



# Update an item
@app.put("/items/{item_id}")
def update_item(item_id: int, item: Item):
    try:
        # Generate QR code content
        qr_data = f"Item: {item.name}\nLocation: {item.location}\nContainer: {item.storage_container or 'None'}"
        qr_code_data = generate_qr_code(qr_data)  # Use raw output from generate_qr_code()

        # Update the database
        query = """
            UPDATE items
            SET name = %s, category = %s, description = %s, quantity = %s,
                location = %s, storage_container = %s, tags = %s, qr_code = %s
            WHERE id = %s
        """
        cursor.execute(query, (
            item.name, item.category, item.description, item.quantity,
            item.location, item.storage_container, item.tags, qr_code_data, item_id
        ))
        conn.commit()
        conn.close()


        return {"message": "Item updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error updating item")


# Delete an item
@app.delete("/items/{item_id}")
def delete_item(item_id: int):
    try:
        # First, fetch the category of the item being deleted
        cursor.execute("SELECT category FROM items WHERE id = %s;", (item_id,))
        category = cursor.fetchone()

        # Delete the item
        cursor.execute("DELETE FROM items WHERE id = %s RETURNING id;", (item_id,))
        conn.commit()
        conn.close()

        deleted_item_id = cursor.fetchone()

        if deleted_item_id:
            # Check if the category has any remaining items
            if category:
                cursor.execute("SELECT COUNT(*) FROM items WHERE category = %s;", (category[0],))
                count = cursor.fetchone()[0]
                if count == 0:  # If no items are left, remove the category
                    cursor.execute("DELETE FROM categories WHERE name = %s;", (category[0],))
                    conn.commit()
                    conn.close()


            return {"id": deleted_item_id[0], "message": "Item deleted successfully"}

        return {"error": "Item not found"}, 404
    except Exception as e:
        conn.rollback()
        print("Error during item deletion:", e)
        return {"error": "Server error"}, 500


# Get Items
@app.get("/items/")
def get_items():
    try:
        cursor.execute("SELECT * FROM items;")
        rows = cursor.fetchall()
        items = []
        for row in rows:
            items.append({
                "id": row[0],
                "name": row[1],
                "category": row[2],
                "description": row[3],
                "quantity": row[4],
                "location": row[5],
                "storage_container": row[6],
                "tags": row[7],
                "qr_code": row[8],  # Use raw value from the database
            })
        return items
    except Exception as e:
        print(f"Error in get_items: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")



@app.get("/categories/")
def get_categories():
    try:
        cursor.execute("SELECT name, color, icon FROM categories;")
        rows = cursor.fetchall()
        # Provide default values if color or icon are NULL
        categories = {
            row[0]: {"color": row[1] or "#E0E0E0", "icon": row[2] or "fa-solid fa-question-circle"}
            for row in rows
        }
        return {"categories": categories}
    except Exception as e:
        print("Error fetching categories:", e)
        return {"error": "Could not fetch categories"}, 500

@app.on_event("shutdown")
def shutdown_event():
    cursor.close()
    connection.close()

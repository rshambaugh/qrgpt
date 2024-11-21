from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import psycopg2
import qrcode
import io
import base64

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
    qr_code: Optional[str] = None

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to QRganizer!"}

# Create an item
@app.post("/items/")
def create_item(item: Item):
    try:
        print(f"Creating item: {item}")  # Debugging log

        # Check if the category exists
        cursor.execute("SELECT * FROM categories WHERE name = %s", (item.category,))
        category = cursor.fetchone()

        if not category:
            # If the category doesn't exist, insert it with default values
            default_color = "#E0E0E0"  # Default gray color
            default_icon = "fa-solid fa-question-circle"  # Default question icon
            cursor.execute(
                """
                INSERT INTO categories (name, color, icon)
                VALUES (%s, %s, %s)
                """,
                (item.category, default_color, default_icon),
            )
            conn.commit()
            print(f"Added new category: {item.category}")

        # Generate QR code content
        qr_data = f"Item: {item.name}\nLocation: {item.location}\nContainer: {item.storage_container or 'None'}"

        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_Q,  # High error correction
            box_size=8,  # Smaller box size to reduce QR code size
            border=4,  # Smaller border for tighter fitting
        )
        qr.add_data(qr_data)
        qr.make(fit=True)

        # Generate and resize the QR code image
        # Generate and save QR Code data
        img = qr.make_image(fill="black", back_color="white")
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        qr_code_data = f"data:image/png;base64,{base64.b64encode(buffered.getvalue()).decode('utf-8')}"

        # Save to database
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
                qr_code_data,  # Ensure this matches the Base64 format
            ),
        )
        conn.commit()

        item_id = cursor.fetchone()
        if item_id:
            return {"id": item_id[0], "qr_code": qr_code_data}
    except Exception as e:
        conn.rollback()
        print(f"Error during creation: {e}")
        return {"error": "Server error"}, 500


# Get a specific item
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
            # Ensure the qr_code field includes the base64 prefix
            "qr_code": f"data:image/png;base64,{row[8]}" if row[8] else None,
                }
        return {"item": item}
    return {"error": "Item not found"}, 404

# Update an item
@app.put("/items/{item_id}")
def update_item(item_id: int, item: Item):
    try:
        print(f"Updating item with ID: {item_id}")  # Debugging log

        # Check if the category exists
        cursor.execute("SELECT * FROM categories WHERE name = %s;", (item.category,))
        category = cursor.fetchone()
        if not category:
            print(f"Category '{item.category}' does not exist. Creating a new category.")
            # Create a new category with default values
            cursor.execute(
                """
                INSERT INTO categories (name, color, icon)
                VALUES (%s, %s, %s);
                """,
                (
                    item.category,
                    "#E0E0E0",  # Default color
                    None,       # Default icon
                ),
            )
            conn.commit()

        # Generate updated QR code content
        qr_data = f"Item: {item.name}\nLocation: {item.location}\nContainer: {item.storage_container or 'None'}"

        # Generate the QR Code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_Q,
            box_size=10,  # Appropriate size for clarity
            border=4,     # Ensure sufficient border
        )
        qr.add_data(qr_data)
        qr.make(fit=True)

        # Convert QR Code to base64
        img = qr.make_image(fill="black", back_color="white")
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        qr_code_data = f"data:image/png;base64,{base64.b64encode(buffered.getvalue()).decode()}"

        # Update the database with the new data and QR code
        cursor.execute(
            """
            UPDATE items
            SET name = %s, category = %s, description = %s, quantity = %s, 
                location = %s, storage_container = %s, tags = %s, qr_code = %s
            WHERE id = %s
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
                qr_code_data,  # Updated QR code
                item_id,
            ),
        )
        conn.commit()
        updated_item_id = cursor.fetchone()
        print("Updated Item ID:", updated_item_id)  # Debugging log

        if updated_item_id:
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
                    "qr_code": row[8],  # Include qr_code here
                }

                return {"item": updated_item, "message": "Item updated successfully"}
        return {"error": "Item not found"}, 404

    except Exception as e:
        conn.rollback()  # Roll back the transaction to avoid the aborted state
        print("Error during update:", e)  # Debugging log
        return {"error": "Server error"}, 500


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
        deleted_item_id = cursor.fetchone()

        if deleted_item_id:
            # Check if the category has any remaining items
            if category:
                cursor.execute("SELECT COUNT(*) FROM items WHERE category = %s;", (category[0],))
                count = cursor.fetchone()[0]
                if count == 0:  # If no items are left, remove the category
                    cursor.execute("DELETE FROM categories WHERE name = %s;", (category[0],))
                    conn.commit()

            return {"id": deleted_item_id[0], "message": "Item deleted successfully"}

        return {"error": "Item not found"}, 404
    except Exception as e:
        conn.rollback()
        print("Error during item deletion:", e)
        return {"error": "Server error"}, 500


# Get all items
@app.get("/items/")
def get_items():
    try:
        # Fetch items along with their associated category details
        query = """
            SELECT 
                i.id, i.name, i.category, i.description, i.quantity, 
                i.location, i.storage_container, i.tags, i.qr_code, 
                c.color, c.icon
            FROM items i
            LEFT JOIN categories c ON i.category = c.name;
        """
        cursor.execute(query)
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
                "qr_code": f"data:image/png;base64,{row[8]}" if row[8] else None,
                "category_color": row[9] or "#E0E0E0",  # Default color if none exists
                "category_icon": row[10] or "fa-solid fa-question",  # Default icon if none exists
            }
            for row in rows
        ]

        return items

    except Exception as e:
        print(f"Error fetching items: {e}")
        return {"error": "Server error"}, 500

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

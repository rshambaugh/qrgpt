import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import asyncpg
import qrcode
import io
import base64
from dotenv import load_dotenv
from contextlib import asynccontextmanager

# Load environment variables from the .env file
load_dotenv()

# Retrieve environment variables
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "5432")  # Default to PostgreSQL port if not specified
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

# Verify environment variables are loaded
if not all([DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME]):
    raise EnvironmentError("Missing required database environment variables. Check your .env file.")

# Initialize the FastAPI app instance
app = FastAPI()

async def initialize_connection_pool():
    """
    Initialize a connection pool for the database.
    """
    try:
        return await asyncpg.create_pool(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            min_size=1,
            max_size=10
        )
    except Exception as e:
        raise RuntimeError(f"Error initializing connection pool: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize connection pool
    print("Initializing connection pool...")
    app.state.db_pool = await initialize_connection_pool()
    yield
    # Shutdown: Close connection pool
    print("Closing connection pool...")
    await app.state.db_pool.close()

# Use the lifespan function for the app
app = FastAPI(lifespan=lifespan)

# Dependency to get a database connection
async def get_db_connection():
    async with app.state.db_pool.acquire() as connection:
        yield connection

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
    storage_container: Optional[int] = None
    tags: Optional[list[str]] = []
    qr_code: Optional[str] = None

# Define the Container model
class Container(BaseModel):
    name: str
    parent_container_id: Optional[int] = None
    location: Optional[str] = None
    tags: Optional[list[str]] = []
    qr_code: Optional[str] = None

# Root endpoint
@app.get("/")
async def read_root():
    return {"message": "Welcome to QRganizer"}

# Helper function to check if an item is a container
async def check_is_container(item_id: int, connection=Depends(get_db_connection)) -> bool:
    """
    Check if an item is a container by checking for nested items.
    """
    query = "SELECT COUNT(*) FROM items WHERE storage_container = $1;"
    count = await connection.fetchval(query, item_id)  # Fetch a single value (COUNT)
    return count > 0


@app.post("/containers/")
async def create_container(container: Container, connection=Depends(get_db_connection)):
    try:
        # Generate QR code content
        qr_data = f"Container: {container.name}\nLocation: {container.location or 'N/A'}"
        qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_Q, box_size=8, border=4)
        qr.add_data(qr_data)
        qr.make(fit=True)

        # Convert QR code to base64
        img = qr.make_image(fill="black", back_color="white")
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        qr_code_data = f"data:image/png;base64,{base64.b64encode(buffered.getvalue()).decode('utf-8')}"

        # Insert the container into the database
        query = """
            INSERT INTO containers (name, parent_container_id, location, tags, qr_code)
            VALUES ($1, $2, $3, $4, $5) RETURNING id;
        """
        container_id = await connection.fetchval(
            query, 
            container.name, 
            container.parent_container_id, 
            container.location, 
            container.tags, 
            qr_code_data
        )
        
        return {"id": container_id, "qr_code": qr_code_data}
    except Exception as e:
        print(f"Error creating container: {e}")
        raise HTTPException(status_code=500, detail="Server error")


async def fetch_nested_containers(container_id: int, connection) -> list:
    """
    Recursively fetch nested containers.
    """
    query = "SELECT id, name, parent_container_id, location, tags, qr_code FROM containers WHERE parent_container_id = $1;"
    containers = await connection.fetch(query, container_id)

    nested_containers = []
    for container in containers:
        container_data = {
            "id": container["id"],
            "name": container["name"],
            "parent_container_id": container["parent_container_id"],
            "location": container["location"],
            "tags": container["tags"],
            "qr_code": container["qr_code"],
            "nested_containers": await fetch_nested_containers(container["id"], connection),  # Recursive call
        }
        nested_containers.append(container_data)

    return nested_containers


@app.get("/containers/{container_id}")
async def get_container(container_id: int, connection=Depends(get_db_connection)):
    try:
        # Get container details
        container_query = "SELECT id, name, parent_container_id, location, tags, qr_code FROM containers WHERE id = $1;"
        container = await connection.fetchrow(container_query, container_id)
        if not container:
            raise HTTPException(status_code=404, detail="Container not found")

        container_data = {
            "id": container["id"],
            "name": container["name"],
            "parent_container_id": container["parent_container_id"],
            "location": container["location"],
            "tags": container["tags"],
            "qr_code": container["qr_code"],
        }

        # Get items inside the container
        items_query = """
            SELECT id, name, category, description, quantity, location, storage_container, tags, qr_code 
            FROM items WHERE storage_container = $1;
        """
        items = await connection.fetch(items_query, container_id)
        items_data = [
            {
                "id": item["id"],
                "name": item["name"],
                "category": item["category"],
                "description": item["description"],
                "quantity": item["quantity"],
                "location": item["location"],
                "tags": item["tags"],
                "qr_code": item["qr_code"],
            }
            for item in items
        ]

        # Fetch all nested containers recursively
        nested_containers = await fetch_nested_containers(container_id, connection)

        return {
            "container": container_data,
            "items": items_data,
            "nested_containers": nested_containers,
        }
    except Exception as e:
        print(f"Error fetching container: {e}")
        raise HTTPException(status_code=500, detail="Server error")


@app.put("/containers/{container_id}")
async def update_container(container_id: int, container: Container, connection=Depends(get_db_connection)):
    try:
        query = """
            UPDATE containers
            SET name = $1, parent_container_id = $2, location = $3, tags = $4, qr_code = $5
            WHERE id = $6 RETURNING id;
        """
        updated_id = await connection.fetchval(
            query,
            container.name,
            container.parent_container_id,
            container.location,
            container.tags,
            container.qr_code,
            container_id,
        )
        if updated_id:
            return {"id": updated_id, "message": "Container updated successfully"}
        raise HTTPException(status_code=404, detail="Container not found")
    except Exception as e:
        print(f"Error updating container: {e}")
        raise HTTPException(status_code=500, detail="Server error")


@app.delete("/containers/{container_id}")
async def delete_container(container_id: int, connection=Depends(get_db_connection)):
    try:
        query = "DELETE FROM containers WHERE id = $1 RETURNING id;"
        deleted_id = await connection.fetchval(query, container_id)
        if deleted_id:
            return {"id": deleted_id, "message": "Container deleted successfully"}
        raise HTTPException(status_code=404, detail="Container not found")
    except Exception as e:
        print(f"Error deleting container: {e}")
        raise HTTPException(status_code=500, detail="Server error")


@app.post("/items/")
async def create_item(item: Item, connection=Depends(get_db_connection)):
    try:
        print(f"Creating item: {item}")  # Debugging log

        # Check if the category exists
        category_query = "SELECT * FROM categories WHERE name = $1;"
        category = await connection.fetchrow(category_query, item.category)

        if not category:
            # If the category doesn't exist, insert it with default values
            default_color = "#E0E0E0"  # Default gray color
            default_icon = "fa-solid fa-question-circle"  # Default question icon
            insert_category_query = """
                INSERT INTO categories (name, color, icon)
                VALUES ($1, $2, $3)
            """
            await connection.execute(insert_category_query, item.category, default_color, default_icon)
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
        img = qr.make_image(fill="black", back_color="white")
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        qr_code_data = f"data:image/png;base64,{base64.b64encode(buffered.getvalue()).decode('utf-8')}"

        # Save item to the database
        insert_item_query = """
            INSERT INTO items (name, category, description, quantity, location, storage_container, tags, qr_code)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id;
        """
        item_id = await connection.fetchval(
            insert_item_query,
            item.name,
            item.category,
            item.description,
            item.quantity,
            item.location,
            int(item.storage_container) if item.storage_container else None,
            item.tags,
            qr_code_data,
        )

        if item_id:
            return {"id": item_id, "qr_code": qr_code_data}
        raise HTTPException(status_code=500, detail="Failed to create item")
    except Exception as e:
        print(f"Error during creation: {e}")
        raise HTTPException(status_code=500, detail="Server error")


@app.get("/items/{item_id}")
async def get_item(item_id: int, connection=Depends(get_db_connection)):
    try:
        query = """
            SELECT id, name, category, description, quantity, location, storage_container, tags, qr_code
            FROM items WHERE id = $1;
        """
        row = await connection.fetchrow(query, item_id)
        if row:
            item = {
                "id": row["id"],
                "name": row["name"],
                "category": row["category"],
                "description": row["description"],
                "quantity": row["quantity"],
                "location": row["location"],
                "storage_container": row["storage_container"],
                "tags": row["tags"],
                "qr_code": f"data:image/png;base64,{row['qr_code']}" if row["qr_code"] else None,
            }
            return {"item": item}
        raise HTTPException(status_code=404, detail="Item not found")
    except Exception as e:
        print(f"Error fetching item: {e}")
        raise HTTPException(status_code=500, detail="Server error")



# Update an item
@app.put("/items/{item_id}")
async def update_item(item_id: int, item: Item, connection=Depends(get_db_connection)):
    try:
        print(f"Updating item with ID: {item_id}")  # Debugging log

        # Check if the category exists
        category_query = "SELECT * FROM categories WHERE name = $1;"
        category = await connection.fetchrow(category_query, item.category)

        if not category:
            print(f"Category '{item.category}' does not exist. Creating a new category.")
            # Create a new category with default values
            insert_category_query = """
                INSERT INTO categories (name, color, icon)
                VALUES ($1, $2, $3);
            """
            await connection.execute(insert_category_query, item.category, "#E0E0E0", None)  # Default color and icon

        # Generate updated QR code content
        qr_data = f"Item: {item.name}\nLocation: {item.location}\nContainer: {item.storage_container or 'None'}"

        # Generate QR Code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_Q,  # High error correction
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

        # Update the item in the database
        update_item_query = """
            UPDATE items
            SET name = $1, category = $2, description = $3, quantity = $4, 
                location = $5, storage_container = $6, tags = $7, qr_code = $8
            WHERE id = $9
            RETURNING id;
        """
        updated_item_id = await connection.fetchval(
            update_item_query,
            item.name,
            item.category,
            item.description,
            item.quantity,
            item.location,
            int(item.storage_container) if item.storage_container else None,
            item.tags,
            qr_code_data,
            item_id,
        )

        if updated_item_id:
            # Fetch the updated item to return it in the response
            fetch_item_query = """
                SELECT id, name, category, description, quantity, location, 
                       storage_container, tags, qr_code
                FROM items WHERE id = $1;
            """
            row = await connection.fetchrow(fetch_item_query, item_id)
            if row:
                updated_item = {
                    "id": row["id"],
                    "name": row["name"],
                    "category": row["category"],
                    "description": row["description"],
                    "quantity": row["quantity"],
                    "location": row["location"],
                    "storage_container": row["storage_container"],
                    "tags": row["tags"],
                    "qr_code": f"data:image/png;base64,{row['qr_code']}" if row["qr_code"] else None,
                }
                return {"item": updated_item, "message": "Item updated successfully"}

        raise HTTPException(status_code=404, detail="Item not found")
    except Exception as e:
        print("Error during update:", e)  # Debugging log
        raise HTTPException(status_code=500, detail="Server error")

# Delete an item
@app.delete("/items/{item_id}")
async def delete_item(item_id: int, connection=Depends(get_db_connection)):
    try:
        # First, fetch the category of the item being deleted
        category_query = "SELECT category FROM items WHERE id = $1;"
        category = await connection.fetchval(category_query, item_id)

        # Delete the item
        delete_item_query = "DELETE FROM items WHERE id = $1 RETURNING id;"
        deleted_item_id = await connection.fetchval(delete_item_query, item_id)

        if deleted_item_id:
            # Check if the category has any remaining items
            if category:
                count_query = "SELECT COUNT(*) FROM items WHERE category = $1;"
                count = await connection.fetchval(count_query, category)
                if count == 0:  # If no items are left, remove the category
                    delete_category_query = "DELETE FROM categories WHERE name = $1;"
                    await connection.execute(delete_category_query, category)

            return {"id": deleted_item_id, "message": "Item deleted successfully"}

        raise HTTPException(status_code=404, detail="Item not found")
    except Exception as e:
        print("Error during item deletion:", e)
        raise HTTPException(status_code=500, detail="Server error")


# Get all items
@app.get("/items/")
async def get_items():
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

        items = []
        for row in rows:
            item_id = row[0]
            is_container = check_is_container(item_id)
            items.append({
                "id": item_id,
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
                "is_container": is_container,
            })

        return items

    except Exception as e:
        print(f"Error fetching items: {e}")
        return {"error": "Server error"}, 500


@app.get("/categories/")
async def get_categories(connection=Depends(get_db_connection)):
    try:
        query = "SELECT name, color, icon FROM categories;"
        rows = await connection.fetch(query)

        # Provide default values if color or icon are NULL
        categories = {
            row["name"]: {
                "color": row["color"] or "#E0E0E0",  # Default gray color if none exists
                "icon": row["icon"] or "fa-solid fa-question-circle",  # Default icon if none exists
            }
            for row in rows
        }

        return {"categories": categories}
    except Exception as e:
        print("Error fetching categories:", e)
        raise HTTPException(status_code=500, detail="Could not fetch categories")


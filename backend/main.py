import os
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import text
from fastapi.routing import APIRouter
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import dotenv_values
from jose import jwt, JWTError

import qrcode
import io
from dotenv import load_dotenv
import aiofiles
import qrcode
import base64

security = HTTPBearer()
router = APIRouter()

# Determine which .env file to load based on APP_ENV
app_env = os.getenv("APP_ENV", "development")  # Default to 'development'
dotenv_file = ".env" if app_env == "development" else ".env.production"
# Load environment variables
jwt_env = dotenv_values(".jwt_env")  # Load from the new .jwt_env file
load_dotenv(dotenv_file)
print(f"Loaded .env from {dotenv_file}")
print(f"DB_USER: {os.getenv('DB_USER')}, DB_PASSWORD: {os.getenv('DB_PASSWORD')}, DB_NAME: {os.getenv('DB_NAME')}")

# Fetch JWT-related configurations
SECRET_KEY = jwt_env.get("SECRET_KEY", "default_secret_key")
ALGORITHM = jwt_env.get("ALGORITHM", "HS256")
security = HTTPBearer()

# Utility: Generate a QR code
async def generate_qr_code(content: str) -> str:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_Q,
        box_size=10,
        border=4,
    )
    qr.add_data(content)
    qr.make(fit=True)

    buffered = io.BytesIO()
    img = qr.make_image(fill="black", back_color="white")
    img.save(buffered, format="PNG")
    return f"data:image/png;base64,{base64.b64encode(buffered.getvalue()).decode('utf-8')}"

# Utility: Create a JWT
def create_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

# Utility: Verify a JWT
def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return decoded  # Return the payload if valid
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")



# Build the DATABASE_URL dynamically
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME")
DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Log which environment and database are being used
print(f"Environment: {app_env}")
print(f"Using DATABASE_URL: {DATABASE_URL}")


engine = create_async_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)
Base = declarative_base()

# FastAPI app initialization
app = FastAPI()

class CodeUpdate(BaseModel):
    file_path: str
    content: str

# Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route: Write code securely
@app.post("/write-code")
async def write_code(data: dict, user: dict = Depends(verify_token)):
    file_path = data.get("file_path")
    content = data.get("content")
    if not file_path or not content:
        raise HTTPException(status_code=400, detail="file_path and content are required.")
    try:
        with open(file_path, "w") as f:
            f.write(content)
        return {"status": "success", "message": f"File '{file_path}' written successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error writing file: {str(e)}")


# Route: Generate a secure token
@app.post("/token")
def generate_token(username: str):
    token = create_token({"sub": username})
    return {"token": token}



# Dependency for database session
async def get_db():
    async with SessionLocal() as session:
        yield session

# SQLAlchemy Models
class Container(Base):
    __tablename__ = "containers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    parent_container_id = Column(Integer, ForeignKey("containers.id"), nullable=True)
    location = Column(String, nullable=True)
    tags = Column(String, nullable=True)
    qr_code = Column(Text, nullable=True)

    parent = relationship("Container", remote_side=[id])
    children = relationship("Container", cascade="all, delete")
    items = relationship("Item", back_populates="storage_container")


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    quantity = Column(Integer, default=1)
    location = Column(String, nullable=False)
    storage_container_id = Column(Integer, ForeignKey("containers.id"), nullable=True)
    tags = Column(String, nullable=True)
    qr_code = Column(Text, nullable=True)

    storage_container = relationship("Container", back_populates="items")


class Category(Base):
    __tablename__ = "categories"

    name = Column(String, primary_key=True, index=True)
    color = Column(String, default="#E0E0E0")
    icon = Column(String, default="fa-solid fa-question-circle")

# Pydantic Schema
class ItemBase(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    quantity: int
    location: str
    storage_container_id: Optional[int] = None
    tags: Optional[List[str]] = []
    qr_code: Optional[str] = None

    class Config:
        from_attributes = True



class ItemCreate(ItemBase):
    pass


class ItemUpdate(ItemBase):
    pass


class ContainerBase(BaseModel):
    name: str
    parent_container_id: Optional[int] = None
    location: Optional[str] = None
    tags: Optional[List[str]] = []
    qr_code: Optional[str] = None

    class Config:
        orm_mode = True


class ContainerCreate(ContainerBase):
    pass


class ContainerUpdate(ContainerBase):
    pass


class CategoryBase(BaseModel):
    name: str
    color: str
    icon: str


class CategoryCreate(CategoryBase):
    pass


# Helper Function
async def generate_qr_code(content: str) -> str:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_Q,
        box_size=10,
        border=4,
    )
    qr.add_data(content)
    qr.make(fit=True)

    # Generate QR Code image
    buffered = io.BytesIO()
    img = qr.make_image(fill="black", back_color="white")

    # Use asynchronous I/O to simulate async file saving/processing
    async with aiofiles.tempfile.NamedTemporaryFile(suffix=".png") as tmp_file:
        img.save(tmp_file.name, format="PNG")
        await tmp_file.flush()  # Ensure it's fully written

        # Read the image back asynchronously
        async with aiofiles.open(tmp_file.name, mode="rb") as f:
            image_data = await f.read()

    return f"data:image/png;base64,{base64.b64encode(image_data).decode('utf-8')}"

# Add the /generate-qr route
@router.post("/generate-qr")
async def generate_qr(data: dict):
    content = data.get("data")
    if not content:
        raise HTTPException(status_code=400, detail="Missing content for QR code generation.")
    
    try:
        # Await the async QR code generation
        qr_code = await generate_qr_code(content)
        return JSONResponse(content={"qr_code": qr_code})
    except Exception as e:
        # Log the error and raise a 500 error
        print(f"Error generating QR code: {str(e)}")  # Replace with proper logging in production
        raise HTTPException(status_code=500, detail=f"Error generating QR code: {str(e)}")

app.include_router(router)

# Create a new item
@app.post("/items/", response_model=ItemBase)
async def create_item(item: ItemCreate, db: AsyncSession = Depends(get_db)):
    try:
        # Ensure the category exists or create it
        category_query = "SELECT * FROM categories WHERE name = :name;"
        category_result = await db.execute(category_query, {"name": item.category})
        category = category_result.fetchone()

        if not category:
            insert_category_query = """
                INSERT INTO categories (name, color, icon)
                VALUES (:name, :color, :icon);
            """
            await db.execute(
                insert_category_query,
                {
                    "name": item.category,
                    "color": "#E0E0E0",  # Default color
                    "icon": "fa-solid fa-question-circle",  # Default icon
                },
            )
            await db.commit()

        # Generate QR Code
        qr_content = f"Item: {item.name}\nLocation: {item.location}\nContainer: {item.storage_container_id or 'None'}"
        qr_code = await generate_qr_code(qr_content)

        # Insert the item into the database
        insert_item_query = """
            INSERT INTO items (name, category, description, quantity, location, storage_container_id, tags, qr_code)
            VALUES (:name, :category, :description, :quantity, :location, :storage_container_id, :tags, :qr_code)
            RETURNING id;
        """
        result = await db.execute(
            insert_item_query,
            {
                **item.dict(),
                "tags": ",".join(item.tags) if item.tags else None,
                "qr_code": qr_code,
            },
        )
        new_item_id = result.fetchone()
        await db.commit()

        # Return the newly created item
        return {**item.dict(), "id": new_item_id.id, "qr_code": qr_code}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating item: {str(e)}")


# Get all items
@app.get("/items/")
async def get_items(db: AsyncSession = Depends(get_db)):
    try:
        query = text("""
            SELECT 
                i.id, i.name, i.category, i.description, i.quantity,
                i.location, i.storage_container_id, i.tags, i.qr_code,
                c.color AS category_color, c.icon AS category_icon
            FROM items i
            LEFT JOIN categories c ON i.category = c.name;
        """)
        result = await db.execute(query)
        rows = result.fetchall()

        items = [
            {
                "id": row.id,
                "name": row.name,
                "category": row.category,
                "description": row.description,
                "quantity": row.quantity,
                "location": row.location,
                "storage_container_id": row.storage_container_id,
                "tags": row.tags if isinstance(row.tags, list) else row.tags.split(",") if row.tags else [],
                "qr_code": row.qr_code,
                "color": row.category_color or "#E0E0E0",
                "icon": row.category_icon or "fa-solid fa-question-circle",
            }
            for row in rows
        ]
        return items
    except Exception as e:
        print(f"Error fetching items: {str(e)}")  # Log the detailed error
        raise HTTPException(status_code=500, detail=f"Error fetching items: {str(e)}")



# Get single item
@app.get("/items/{item_id}", response_model=ItemBase)
async def get_item(item_id: int, db: AsyncSession = Depends(get_db)):
    try:
        query = "SELECT * FROM items WHERE id = :id"
        result = await db.execute(query, {"id": item_id})
        item = result.fetchone()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        return {
            "id": item.id,
            "name": item.name,
            "category": item.category,
            "description": item.description,
            "quantity": item.quantity,
            "location": item.location,
            "storage_container_id": item.storage_container_id,
            "tags": item.tags.split(",") if item.tags else [],
            "qr_code": item.qr_code,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching item: {str(e)}")


# Update an item
@app.put("/items/{item_id}", response_model=ItemBase)
async def update_item(item_id: int, item: ItemUpdate, db: AsyncSession = Depends(get_db)):
    try:
        # Generate updated QR Code
        qr_content = f"Item: {item.name}\nLocation: {item.location}\nContainer: {item.storage_container_id or 'None'}"
        qr_code = await generate_qr_code(qr_content)

        # Update the item in the database
        query = """
            UPDATE items
            SET name = :name, category = :category, description = :description,
                quantity = :quantity, location = :location, 
                storage_container_id = :storage_container_id, tags = :tags, qr_code = :qr_code
            WHERE id = :id
            RETURNING *;
        """
        result = await db.execute(query, {
            "id": item_id,
            **item.dict(),
            "tags": ",".join(item.tags) if item.tags else None,
            "qr_code": qr_code,
        })
        updated_item = result.fetchone()
        await db.commit()

        if not updated_item:
            raise HTTPException(status_code=404, detail="Item not found")

        return {
            "id": updated_item.id,
            "name": updated_item.name,
            "category": updated_item.category,
            "description": updated_item.description,
            "quantity": updated_item.quantity,
            "location": updated_item.location,
            "storage_container_id": updated_item.storage_container_id,
            "tags": updated_item.tags.split(",") if updated_item.tags else [],
            "qr_code": updated_item.qr_code,
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating item: {str(e)}")



@app.delete("/items/{item_id}", response_model=dict)
async def delete_item(item_id: int, db: AsyncSession = Depends(get_db)):
    try:
        # Delete the item
        query = "DELETE FROM items WHERE id = :id RETURNING id;"
        result = await db.execute(query, {"id": item_id})
        deleted_item = result.fetchone()
        await db.commit()

        if not deleted_item:
            raise HTTPException(status_code=404, detail="Item not found")

        return {"message": "Item deleted successfully", "id": deleted_item.id}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting item: {str(e)}")


# API Endpoints for Containers

# Create a new container
@app.post("/containers/", response_model=ContainerBase)
async def create_container(container: ContainerCreate, db: AsyncSession = Depends(get_db)):
    try:
        # Generate QR Code
        qr_content = f"Container: {container.name}\nLocation: {container.location or 'N/A'}"
        qr_code = await generate_qr_code(qr_content)

        # Insert the container into the database
        query = """
            INSERT INTO containers (name, parent_container_id, location, tags, qr_code)
            VALUES (:name, :parent_container_id, :location, :tags, :qr_code)
            RETURNING id;
        """
        result = await db.execute(query, {
            "name": container.name,
            "parent_container_id": container.parent_container_id,
            "location": container.location,
            "tags": ",".join(container.tags) if container.tags else None,
            "qr_code": qr_code,
        })
        container_id = result.fetchone()
        await db.commit()

        return {**container.dict(), "id": container_id.id, "qr_code": qr_code}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating container: {str(e)}")



# Get all containers
@app.get("/containers/", response_model=List[ContainerBase])
async def get_containers(db: AsyncSession = Depends(get_db)):
    try:
        # Wrap the SQL query in `text()` to avoid SQLAlchemy errors
        query = text("SELECT * FROM containers;")
        result = await db.execute(query)
        rows = result.fetchall()

        # Process rows into the expected format
        containers = [
            {
                "id": row.id,
                "name": row.name,
                "parent_container_id": row.parent_container_id,
                "location": row.location,
                "tags": row.tags.split(",") if row.tags and isinstance(row.tags, str) else [],
                "qr_code": row.qr_code,
            }
            for row in rows
        ]
        return containers
    except Exception as e:
        # Log and raise an HTTP exception with details
        print(f"Error fetching containers: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching containers: {str(e)}")





# Get a specific container
@app.get("/containers/{container_id}")
async def get_container(container_id: int, db: AsyncSession = Depends(get_db)):
    try:
        # Fetch container details
        container_query = "SELECT * FROM containers WHERE id = :id;"
        result = await db.execute(container_query, {"id": container_id})
        container = result.fetchone()
        if not container:
            raise HTTPException(status_code=404, detail="Container not found")

        # Fetch nested containers
        nested_query = "SELECT * FROM containers WHERE parent_container_id = :parent_id;"
        nested_result = await db.execute(nested_query, {"parent_id": container_id})
        nested_containers = [
            {
                "id": row.id,
                "name": row.name,
                "parent_container_id": row.parent_container_id,
                "location": row.location,
                "tags": row.tags.split(",") if row.tags else [],
                "qr_code": row.qr_code,
            }
            for row in nested_result.fetchall()
        ]

        # Fetch items in the container
        items_query = "SELECT * FROM items WHERE storage_container_id = :container_id;"
        items_result = await db.execute(items_query, {"container_id": container_id})
        items = [
            {
                "id": row.id,
                "name": row.name,
                "category": row.category,
                "description": row.description,
                "quantity": row.quantity,
                "location": row.location,
                "tags": row.tags.split(",") if row.tags else [],
                "qr_code": row.qr_code,
            }
            for row in items_result.fetchall()
        ]

        return {
            "container": {
                "id": container.id,
                "name": container.name,
                "parent_container_id": container.parent_container_id,
                "location": container.location,
                "tags": container.tags.split(",") if container.tags else [],
                "qr_code": container.qr_code,
            },
            "nested_containers": nested_containers,
            "items": items,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching container: {str(e)}")



@app.put("/containers/{container_id}", response_model=ContainerBase)
async def update_container(container_id: int, container: ContainerUpdate, db: AsyncSession = Depends(get_db)):
    try:
        # Generate updated QR Code
        qr_content = f"Container: {container.name}\nLocation: {container.location or 'N/A'}"
        qr_code = await generate_qr_code(qr_content)

        # Update the container in the database
        query = """
            UPDATE containers
            SET name = :name, parent_container_id = :parent_container_id, location = :location,
                tags = :tags, qr_code = :qr_code
            WHERE id = :id
            RETURNING id, name, parent_container_id, location, tags, qr_code;
        """
        result = await db.execute(query, {
            "id": container_id,
            **container.dict(),
            "tags": ",".join(container.tags) if container.tags else None,
            "qr_code": qr_code,
        })
        updated_container = result.fetchone()
        await db.commit()

        if not updated_container:
            raise HTTPException(status_code=404, detail="Container not found")

        # Construct response object directly from the returned result
        return dict(updated_container._mapping)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating container: {str(e)}")


# Delete a container
@app.delete("/containers/{container_id}", response_model=dict)
async def delete_container(container_id: int, db: AsyncSession = Depends(get_db)):
    try:
        # Check for nested containers or items
        nested_query = "SELECT COUNT(*) FROM containers WHERE parent_container_id = :parent_id;"
        nested_result = await db.execute(nested_query, {"parent_id": container_id})
        nested_count = nested_result.scalar()

        items_query = "SELECT COUNT(*) FROM items WHERE storage_container_id = :container_id;"
        items_result = await db.execute(items_query, {"container_id": container_id})
        items_count = items_result.scalar()

        if nested_count > 0 or items_count > 0:
            raise HTTPException(
                status_code=400,
                detail="Container cannot be deleted because it contains nested containers or items.",
            )

        # Delete the container
        delete_query = "DELETE FROM containers WHERE id = :id RETURNING id;"
        result = await db.execute(delete_query, {"id": container_id})
        deleted_container_id = result.fetchone()
        await db.commit()

        if not deleted_container_id:
            raise HTTPException(status_code=404, detail="Container not found")

        return {"message": "Container deleted successfully", "id": deleted_container_id.id}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting container: {str(e)}")

# Create a newcontainer
async def fetch_nested_containers(container_id: int):
    query = "SELECT * FROM containers WHERE parent_container_id = :parent_id"
    rows = await database.fetch_all(query=query, values={"parent_id": container_id})
    nested_containers = []
    for row in rows:
        container_data = {
            "id": row["id"],
            "name": row["name"],
            "parent_container_id": row["parent_container_id"],
            "location": row["location"],
            "tags": row["tags"].split(",") if row["tags"] else [],
            "qr_code": row["qr_code"],
            "nested_containers": await fetch_nested_containers(row["id"]),
        }
        nested_containers.append(container_data)
    return nested_containers

@app.get("/containers/{container_id}")
async def get_container(container_id: int):
    try:
        # Fetch container details
        container_query = "SELECT * FROM containers WHERE id = :id"
        container = await database.fetch_one(query=container_query, values={"id": container_id})
        if not container:
            raise HTTPException(status_code=404, detail="Container not found")

        # Fetch nested containers
        nested_containers = await fetch_nested_containers(container_id)

        # Fetch items in the container
        items_query = "SELECT * FROM items WHERE storage_container = :container_id"
        items = await database.fetch_all(query=items_query, values={"container_id": container_id})

        return {
            "container": {
                "id": container["id"],
                "name": container["name"],
                "parent_container_id": container["parent_container_id"],
                "location": container["location"],
                "tags": container["tags"].split(",") if container["tags"] else [],
                "qr_code": container["qr_code"],
            },
            "items": [
                {
                    "id": item["id"],
                    "name": item["name"],
                    "category": item["category"],
                    "description": item["description"],
                    "quantity": item["quantity"],
                    "location": item["location"],
                    "tags": item["tags"].split(",") if item["tags"] else [],
                    "qr_code": item["qr_code"],
                }
                for item in items
            ],
            "nested_containers": nested_containers,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching container: {str(e)}")


@app.get("/categories/")
async def get_categories(db: AsyncSession = Depends(get_db)):
    try:
        query = text("SELECT name, color, icon FROM categories;")
        result = await db.execute(query)
        rows = result.fetchall()

        categories = {
            row.name: {
                "color": row.color or "#E0E0E0",
                "icon": row.icon or "fa-solid fa-question-circle",
            }
            for row in rows
        }
        return {"categories": categories}
    except Exception as e:
        print(f"Error fetching categories: {str(e)}")  # Log the error
        raise HTTPException(status_code=500, detail=f"Error fetching categories: {str(e)}")

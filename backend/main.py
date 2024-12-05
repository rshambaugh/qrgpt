from fastapi import FastAPI, HTTPException, Depends, Path
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import MetaData, Table, Column, Integer, String, ForeignKey, select
from sqlalchemy.sql import func
from sqlalchemy.future import select
from typing import List
from dotenv import load_dotenv
from models import Item, Space, items_table, spaces_table  # Ensure proper imports
import os


# Load environment variables from .env file
load_dotenv()

# Fetch database URL from environment variables
DATABASE_URL = (
    f"postgresql+asyncpg://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@"
    f"{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
)

# Initialize FastAPI app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Update this to match your frontend's URL
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Database setup
metadata = MetaData()

spaces_table = Table(
    "spaces",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String, nullable=False),
    Column("parent_id", Integer, ForeignKey("spaces.id"), nullable=True),
)

items_table = Table(
    "items",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String, nullable=False),
    Column("description", String),
    Column("space_id", Integer, ForeignKey("spaces.id"), nullable=True),
)

# Create async engine and session
engine = create_async_engine(DATABASE_URL, echo=True)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Models for request validation
class ItemCreate(BaseModel):
    name: str
    description: str = None
    space_id: int = None

class SpaceCreate(BaseModel):
    name: str
    parent_id: int = None

class Item(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    space_id: Optional[int] = None  # Make space_id optional

    class Config:
        orm_mode = True

from typing import Optional
from pydantic import BaseModel

class Space(BaseModel):
    id: int
    name: str
    parent_id: Optional[int] = None  # Allow `None` as a value for `parent_id`

    class Config:
        orm_mode = True


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        # Ensure all tables exist
        await conn.run_sync(metadata.create_all)

@app.on_event("shutdown")
async def shutdown():
    await engine.dispose()

# Dependency to get database session
async def get_db():
    async with async_session() as session:
        yield session

# Endpoints
@app.get("/spaces/", response_model=List[Space])
async def get_spaces(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(spaces_table))
    spaces = [dict(row) for row in result.mappings()]
    return spaces  # Ensure `None` values are preserved

@app.post("/spaces/", response_model=Space)
async def create_space(space: SpaceCreate, db: AsyncSession = Depends(get_db)):
    stmt = spaces_table.insert().values(name=space.name, parent_id=space.parent_id).returning(spaces_table)
    result = await db.execute(stmt)
    await db.commit()
    return result.fetchone()

@app.get("/items/", response_model=List[Item])
async def get_items(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(items_table))
    items = [dict(row) for row in result.mappings()]
    return items  # Ensure `None` values are preserved

@app.post("/items/", response_model=Item)
async def create_item(item: ItemCreate, db: AsyncSession = Depends(get_db)):
    stmt = items_table.insert().values(name=item.name, description=item.description, space_id=item.space_id).returning(items_table)
    result = await db.execute(stmt)
    await db.commit()
    return result.fetchone()

@app.put("/items/{item_id}/space", response_model=Item)
async def update_item_space(item_id: int, space_id: int, db: AsyncSession = Depends(get_db)):
    stmt = items_table.update().where(items_table.c.id == item_id).values(space_id=space_id).returning(items_table)
    result = await db.execute(stmt)
    await db.commit()
    updated_item = result.fetchone()
    if not updated_item:
        raise HTTPException(status_code=404, detail="Item not found")
    return updated_item

@app.delete("/items/{item_id}", response_model=dict)
async def delete_item(
    item_id: int = Path(..., description="The ID of the item to delete"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(items_table).where(items_table.c.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    await db.execute(items_table.delete().where(items_table.c.id == item_id))
    await db.commit()
    return {"message": f"Item with ID {item_id} has been deleted"}

@app.delete("/spaces/{space_id}", response_model=dict)
async def delete_space(
    space_id: int = Path(..., description="The ID of the space to delete"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(spaces_table).where(spaces_table.c.id == space_id))
    space = result.scalar_one_or_none()
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")

    # Optional: Prevent deletion of spaces with items
    items_in_space = await db.execute(select(items_table).where(items_table.c.space_id == space_id))
    if items_in_space.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Cannot delete space with items assigned")

    await db.execute(spaces_table.delete().where(spaces_table.c.id == space_id))
    await db.commit()
    return {"message": f"Space with ID {space_id} has been deleted"}

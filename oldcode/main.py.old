from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import MetaData, Table, Column, Integer, String, ForeignKey, select
from sqlalchemy.sql import text
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv
import os
import logging

# Load environment variables
load_dotenv()

DATABASE_URL = (
    f"postgresql+asyncpg://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@"
    f"{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize logging
logger = logging.getLogger("uvicorn.error")

# Database setup
metadata = MetaData()

spaces_table = Table(
    "spaces",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String, nullable=False),
    Column("parent_id", Integer, ForeignKey("spaces.id", ondelete="CASCADE"), nullable=True),
    Column("depth", Integer, nullable=False, default=0),
)

items_table = Table(
    "items",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String, nullable=False),
    Column("description", String, nullable=True),
    Column("space_id", Integer, ForeignKey("spaces.id", ondelete="SET NULL"), nullable=True),
)

engine = create_async_engine(DATABASE_URL, echo=True)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Models
class ItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    space_id: Optional[int] = None

class SpaceCreate(BaseModel):
    name: str
    parent_id: Optional[int] = None

class UpdateParentRequest(BaseModel):
    new_parent_id: Optional[int]

class UpdateSpaceRequest(BaseModel):
    new_space_id: int

class SpaceUpdateRequest(BaseModel):
    name: str

class Item(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    space_id: Optional[int] = None

    class Config:
        orm_mode = True

class Space(BaseModel):
    id: int
    name: str
    parent_id: Optional[int] = None
    depth: Optional[int] = None
    children: Optional[List["Space"]] = None
    items: Optional[List[Item]] = None

    class Config:
        orm_mode = True

# Dependency for database session
async def get_db():
    async with async_session() as session:
        yield session

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(metadata.create_all)

@app.on_event("shutdown")
async def shutdown():
    await engine.dispose()

@app.get("/items/", response_model=List[Item])
async def get_items(db: AsyncSession = Depends(get_db)):
    try:
        logger.info("Fetching items from database")
        result = await db.execute(select(items_table))
        items = result.mappings().all()
        logger.info(f"Fetched items: {items}")
        return items
    except Exception as e:
        logger.error(f"Error fetching items: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch items.")

@app.post("/items/", response_model=Item)
async def create_item(item: ItemCreate, db: AsyncSession = Depends(get_db)):
    try:
        stmt = items_table.insert().values(
            name=item.name,
            description=item.description,
            space_id=item.space_id
        ).returning(items_table)
        result = await db.execute(stmt)
        await db.commit()
        created_item = result.fetchone()
        if not created_item:
            raise HTTPException(status_code=500, detail="Failed to create item")
        return created_item
    except Exception as e:
        logger.error(f"Error creating item: {e}")
        raise HTTPException(status_code=500, detail="Error creating item.")

@app.post("/spaces/", response_model=Space)
async def create_space(space: SpaceCreate, db: AsyncSession = Depends(get_db)):
    try:
        stmt = spaces_table.insert().values(
            name=space.name,
            parent_id=space.parent_id
        ).returning(spaces_table)
        result = await db.execute(stmt)
        await db.commit()
        created_space = result.fetchone()
        if not created_space:
            raise HTTPException(status_code=500, detail="Failed to create space")
        return created_space
    except Exception as e:
        logger.error(f"Error creating space: {e}")
        raise HTTPException(status_code=500, detail="Error creating space")


@app.put("/spaces/{space_id}", response_model=Space)
async def update_space(space_id: int, update: SpaceUpdateRequest, db: AsyncSession = Depends(get_db)):
    try:
        stmt = spaces_table.update().where(spaces_table.c.id == space_id).values(
            name=update.name
        ).returning(spaces_table)
        result = await db.execute(stmt)
        await db.commit()
        updated_space = result.fetchone()
        if not updated_space:
            raise HTTPException(status_code=404, detail="Space not found")
        return updated_space
    except SQLAlchemyError as e:
        logger.error(f"Error updating space: {e}")
        raise HTTPException(status_code=500, detail="Failed to update space")



@app.get("/spaces/{space_id}", response_model=Space)
async def get_space(space_id: int, db: AsyncSession = Depends(get_db)):
    try:
        space_query = select(spaces_table).where(spaces_table.c.id == space_id)
        space_result = await db.execute(space_query)
        space = space_result.fetchone()
        if not space:
            raise HTTPException(status_code=404, detail="Space not found")

        item_query = select(items_table).where(items_table.c.space_id == space_id)
        item_result = await db.execute(item_query)
        items = item_result.mappings().all()

        child_query = select(spaces_table).where(spaces_table.c.parent_id == space_id)
        child_result = await db.execute(child_query)
        children = child_result.mappings().all()

        return {
            "id": space.id,
            "name": space.name,
            "parent_id": space.parent_id,
            "depth": space.depth,
            "items": items,
            "children": children,
        }
    except SQLAlchemyError as e:
        logger.error(f"Database error fetching space: {e}")
        raise HTTPException(status_code=500, detail="Error fetching space.")

@app.get("/spaces-recursive", response_model=dict)
async def get_spaces_recursive(db: AsyncSession = Depends(get_db)):
    query = text("""
    WITH RECURSIVE space_hierarchy AS (
        SELECT id, name, parent_id, depth
        FROM spaces
        WHERE parent_id IS NULL
        UNION ALL
        SELECT s.id, s.name, s.parent_id, sh.depth + 1
        FROM spaces s
        INNER JOIN space_hierarchy sh ON s.parent_id = sh.id
    )
    SELECT id, name, parent_id, depth FROM space_hierarchy ORDER BY depth, id;
    """)
    try:
        logger.info("Executing recursive query for spaces")
        result = await db.execute(query)
        rows = result.mappings().all()
        
        # Convert RowMapping to standard dictionaries
        spaces = [dict(row) for row in rows]

        logger.info(f"Recursive query result: {spaces}")
        return {"spaces": spaces}
    except SQLAlchemyError as e:
        logger.error(f"Error executing recursive query: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch spaces recursively.")


@app.put("/items/{item_id}", response_model=Item)
async def update_item(
    item_id: int, 
    item_data: ItemCreate, 
    db: AsyncSession = Depends(get_db)
):
    """
    Update an item by its ID.
    """
    try:
        # Perform the update
        stmt = items_table.update().where(items_table.c.id == item_id).values(
            name=item_data.name,
            description=item_data.description,
            space_id=item_data.space_id
        ).returning(items_table)
        
        result = await db.execute(stmt)
        await db.commit()
        
        updated_item = result.fetchone()
        if not updated_item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        return updated_item

    except SQLAlchemyError as e:
        logger.error(f"Error updating item: {e}")
        raise HTTPException(status_code=500, detail="Failed to update item")

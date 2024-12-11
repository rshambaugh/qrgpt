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

@app.get("/spaces-recursive")
async def get_spaces_recursive(db: AsyncSession = Depends(get_db)):
    query = text("""
    WITH RECURSIVE space_hierarchy AS (
        SELECT id, name, parent_id, depth
        FROM spaces
        WHERE parent_id IS NULL
        UNION ALL
        SELECT s.id, s.name, s.parent_id, s.depth
        FROM spaces s
        INNER JOIN space_hierarchy sh ON s.parent_id = sh.id
    )
    SELECT * FROM space_hierarchy ORDER BY depth, id;
    """)
    try:
        logger.info("Executing recursive spaces query")
        result = await db.execute(query)
        rows = result.mappings().all()
        logger.info(f"Fetched spaces: {rows}")
        if not rows:
            return {"spaces": []}
        return {"spaces": rows}
    except Exception as e:
        logger.error(f"Error in recursive query: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch spaces.")


@app.put("/spaces/{space_id}/parent", response_model=dict)
async def update_space_parent(
    space_id: int,
    update_request: UpdateParentRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        # Validate new_parent_id exists
        if update_request.new_parent_id is not None:
            validate_parent_query = select(spaces_table.c.id).where(spaces_table.c.id == update_request.new_parent_id)
            validate_parent_result = await db.execute(validate_parent_query)
            if not validate_parent_result.fetchone():
                raise HTTPException(status_code=404, detail="New parent space not found")

        stmt = spaces_table.update().where(spaces_table.c.id == space_id).values(
            parent_id=update_request.new_parent_id
        )
        result = await db.execute(stmt)
        await db.commit()
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Space not found")

        # Adjust depth
        await db.execute(
            text("""
                WITH RECURSIVE updated_spaces AS (
                    SELECT id, parent_id, depth
                    FROM spaces
                    WHERE id = :space_id
                    UNION ALL
                    SELECT s.id, s.parent_id, us.depth + 1
                    FROM spaces s
                    JOIN updated_spaces us ON s.parent_id = us.id
                )
                UPDATE spaces
                SET depth = updated_spaces.depth
                FROM updated_spaces
                WHERE spaces.id = updated_spaces.id
            """),
            {"space_id": space_id}
        )
        await db.commit()
        return {"message": "Space parent updated successfully"}
    except SQLAlchemyError as e:
        logger.error(f"Error updating space parent: {e}")
        raise HTTPException(status_code=500, detail="Failed to update space parent.")

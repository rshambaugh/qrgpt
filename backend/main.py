from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import MetaData, Table, Column, Integer, String, ForeignKey, select
from sqlalchemy.sql import func
from dotenv import load_dotenv
import os

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

class ItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    space_id: Optional[int] = None

class SpaceCreate(BaseModel):
    name: str
    parent_id: Optional[int] = None

class UpdateParentRequest(BaseModel):
    new_parent_id: int

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

@app.get("/spaces/", response_model=List[Space])
async def get_spaces(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(spaces_table))
    return result.mappings().all()

@app.get("/spaces-recursive/", response_model=List[Space])
async def get_spaces_recursive(db: AsyncSession = Depends(get_db)):
    async def fetch_recursive(parent_id=None):
        result = await db.execute(
            select(spaces_table).where(spaces_table.c.parent_id == parent_id)
        )
        spaces = result.fetchall()
        space_data = []
        for space in spaces:
            children = await fetch_recursive(space.id)  # Recursive call
            items_result = await db.execute(
                select(items_table).where(items_table.c.space_id == space.id)
            )
            items = items_result.fetchall()
            space_data.append({
                "id": space.id,
                "name": space.name,
                "parent_id": space.parent_id,
                "depth": space.depth,
                "children": children,
                "items": [{"id": item.id, "name": item.name, "description": item.description} for item in items],
            })
        return space_data

    return await fetch_recursive()



@app.post("/spaces/", response_model=Space)
async def create_space(space: SpaceCreate, db: AsyncSession = Depends(get_db)):
    stmt = spaces_table.insert().values(name=space.name, parent_id=space.parent_id).returning(spaces_table)
    result = await db.execute(stmt)
    await db.commit()
    return result.fetchone()

@app.put("/spaces/{space_id}/parent", response_model=dict)
async def update_space_parent(
    space_id: int,
    update_request: UpdateParentRequest,
    db: AsyncSession = Depends(get_db)
):
    stmt = spaces_table.update().where(spaces_table.c.id == space_id).values(parent_id=update_request.new_parent_id)
    result = await db.execute(stmt)
    await db.commit()

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Space not found")

    # Update depths for all descendants
    await db.execute(
        """
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
        """,
        {"space_id": space_id}
    )
    await db.commit()
    return {"message": "Space parent updated"}


@app.delete("/spaces/{space_id}", response_model=dict)
async def delete_space(space_id: int, db: AsyncSession = Depends(get_db)):
    stmt = spaces_table.delete().where(spaces_table.c.id == space_id)
    await db.execute(stmt)
    await db.commit()
    return {"message": f"Space with ID {space_id} deleted"}

@app.get("/items/", response_model=List[Item])
async def get_items(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(items_table))
    return result.mappings().all()

@app.post("/items/", response_model=Item)
async def create_item(item: ItemCreate, db: AsyncSession = Depends(get_db)):
    stmt = items_table.insert().values(name=item.name, description=item.description, space_id=item.space_id).returning(items_table)
    result = await db.execute(stmt)
    await db.commit()
    return result.fetchone()

@app.put("/items/{item_id}/space", response_model=dict)
async def update_item_space(item_id: int, update_request: UpdateSpaceRequest, db: AsyncSession = Depends(get_db)):
    stmt = items_table.update().where(items_table.c.id == item_id).values(space_id=update_request.new_space_id)
    await db.execute(stmt)
    await db.commit()
    return {"message": "Item moved to new space"}

@app.delete("/items/{item_id}", response_model=dict)
async def delete_item(item_id: int, db: AsyncSession = Depends(get_db)):
    stmt = items_table.delete().where(items_table.c.id == item_id)
    await db.execute(stmt)
    await db.commit()
    return {"message": f"Item with ID {item_id} deleted"}

@app.put("/spaces/{space_id}/parent", response_model=dict)
async def update_space_parent(
    space_id: int,
    update_request: UpdateSpaceRequest,
    db: AsyncSession = Depends(get_db),
):
    stmt = spaces_table.update().where(spaces_table.c.id == space_id).values(parent_id=update_request.new_parent_id)
    await db.execute(stmt)
    await db.commit()

    # Update depths for all descendants
    await db.execute(
        """
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
        """,
        {"space_id": space_id},
    )
    await db.commit()
    return {"message": "Space parent updated and depths recalculated"}

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import MetaData, Table, Column, Integer, String, ForeignKey, select
from sqlalchemy.sql import func
from dotenv import load_dotenv
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
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
metadata = MetaData()

spaces = Table(
    "spaces",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String, nullable=False),
    Column("parent_id", Integer, ForeignKey("spaces.id"), nullable=True),
)

items = Table(
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

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        # Ensure all tables exist
        await conn.run_sync(metadata.create_all)

@app.on_event("shutdown")
async def shutdown():
    await engine.dispose()

# Endpoints
@app.get("/spaces/")
async def get_spaces():
    async with async_session() as session:
        query = select(spaces)
        result = await session.execute(query)
        spaces_list = [
            {"id": row.id, "name": row.name, "parent_id": row.parent_id}
            for row in result.fetchall()
        ]
        return spaces_list

@app.post("/spaces/")
async def create_space(space: SpaceCreate):
    async with async_session() as session:
        new_space = {"name": space.name, "parent_id": space.parent_id}
        query = spaces.insert().values(new_space)
        await session.execute(query)
        await session.commit()
        return {"message": "Space created successfully"}

@app.get("/items/")
async def get_items():
    async with async_session() as session:
        query = select(items)
        result = await session.execute(query)
        items_list = [
            {"id": row.id, "name": row.name, "description": row.description, "space_id": row.space_id}
            for row in result.fetchall()
        ]
        return items_list

@app.post("/items/")
async def create_item(item: ItemCreate):
    async with async_session() as session:
        new_item = {"name": item.name, "description": item.description, "space_id": item.space_id}
        query = items.insert().values(new_item)
        await session.execute(query)
        await session.commit()
        return {"message": "Item created successfully"}

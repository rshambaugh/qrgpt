import os

# Base directory for backend setup
BASE_DIR = "backend"

# Files and their contents
FILES_CONTENT = {
    "models.py": """from sqlalchemy import Column, Integer, String, ForeignKey, MetaData, Table
from sqlalchemy.orm import relationship

metadata = MetaData()

spaces = Table(
    "spaces",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String, nullable=False),
    Column("description", String, nullable=True),
    Column("parent_id", Integer, ForeignKey("spaces.id"), nullable=True),
)

items = Table(
    "items",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String, nullable=False),
    Column("description", String, nullable=True),
    Column("space_id", Integer, ForeignKey("spaces.id"), nullable=False),
)
""",
    "schemas.py": """from pydantic import BaseModel
from typing import Optional, List

class SpaceBase(BaseModel):
    name: str
    description: Optional[str] = None

class SpaceCreate(SpaceBase):
    parent_id: Optional[int] = None

class Space(SpaceBase):
    id: int
    parent_id: Optional[int]

    class Config:
        orm_mode = True

class ItemBase(BaseModel):
    name: str
    description: Optional[str] = None

class ItemCreate(ItemBase):
    space_id: int

class Item(ItemBase):
    id: int
    space_id: int

    class Config:
        orm_mode = True
""",
    "services/spaces.py": """from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models import spaces

async def get_spaces(db: AsyncSession):
    result = await db.execute(select(spaces))
    return result.scalars().all()

async def create_space(db: AsyncSession, space_data):
    new_space = spaces.insert().values(**space_data.dict())
    await db.execute(new_space)
    await db.commit()
""",
    "services/items.py": """from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models import items

async def get_items(db: AsyncSession):
    result = await db.execute(select(items))
    return result.scalars().all()

async def create_item(db: AsyncSession, item_data):
    new_item = items.insert().values(**item_data.dict())
    await db.execute(new_item)
    await db.commit()
""",
    "routes/spaces.py": """from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from schemas import SpaceCreate, Space
from services.spaces import get_spaces, create_space
from utils.db import get_db

router = APIRouter()

@router.get("/", response_model=list[Space])
async def read_spaces(db: AsyncSession = Depends(get_db)):
    return await get_spaces(db)

@router.post("/", response_model=Space)
async def add_space(space: SpaceCreate, db: AsyncSession = Depends(get_db)):
    await create_space(db, space)
    return space
""",
    "routes/items.py": """from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from schemas import ItemCreate, Item
from services.items import get_items, create_item
from utils.db import get_db

router = APIRouter()

@router.get("/", response_model=list[Item])
async def read_items(db: AsyncSession = Depends(get_db)):
    return await get_items(db)

@router.post("/", response_model=Item)
async def add_item(item: ItemCreate, db: AsyncSession = Depends(get_db)):
    await create_item(db, item)
    return item
""",
    "utils/db.py": """from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = (
    f"postgresql+asyncpg://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}"
    f"@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
)

engine = create_async_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)

async def get_db():
    async with SessionLocal() as session:
        yield session
""",
    "main.py": """from fastapi import FastAPI
from routes import items, spaces
from utils.db import engine
from models import metadata

# Create database tables
metadata.create_all(bind=engine)

app = FastAPI()

# Include routers
app.include_router(spaces.router, prefix="/spaces", tags=["Spaces"])
app.include_router(items.router, prefix="/items", tags=["Items"])
""",
}

# Create directories and files
# Add feedback to the script
def create_file_structure():
    # Ensure base directory exists
    os.makedirs(BASE_DIR, exist_ok=True)
    print(f"Created directory: {BASE_DIR}")

    # Create subdirectories
    for subdir in ["services", "routes", "utils"]:
        dir_path = os.path.join(BASE_DIR, subdir)
        os.makedirs(dir_path, exist_ok=True)
        print(f"Created subdirectory: {dir_path}")

    # Create files with content
    for filename, content in FILES_CONTENT.items():
        filepath = os.path.join(BASE_DIR, filename)
        with open(filepath, "w") as f:
            f.write(content)
        print(f"Created file: {filepath}")


if __name__ == "__main__":
    create_file_structure()
    print("Backend structure created successfully!")

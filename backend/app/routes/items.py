# backend/app/routes/items.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from ..schemas import ItemCreate, Item
from ..services.items import get_items, create_item
from ..utils.db import get_db

router = APIRouter()

@router.get("/", response_model=list[Item])
async def read_items(db: AsyncSession = Depends(get_db)):
    return await get_items(db)

@router.post("/", response_model=Item)
async def add_item(item: ItemCreate, db: AsyncSession = Depends(get_db)):
    await create_item(db, item)
    return item

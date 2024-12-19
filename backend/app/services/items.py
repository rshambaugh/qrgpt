# backend/app/services/items.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..models import Item
from ..schemas import ItemCreate

async def get_items(db: AsyncSession):
    result = await db.execute(select(Item))
    return result.scalars().all()

async def create_item(db: AsyncSession, item_data: ItemCreate):
    new_item = Item(**item_data.dict())
    db.add(new_item)
    await db.commit()
    await db.refresh(new_item)
    return new_item

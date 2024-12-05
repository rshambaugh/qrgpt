from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models import items

async def get_items(db: AsyncSession):
    result = await db.execute(select(items))
    return result.scalars().all()

async def create_item(db: AsyncSession, item_data):
    new_item = items.insert().values(**item_data.dict())
    await db.execute(new_item)
    await db.commit()

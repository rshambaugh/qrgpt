# backend/app/services/spaces.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..models import Space
from ..schemas import SpaceCreate

async def get_spaces(db: AsyncSession):
    result = await db.execute(select(Space))
    return result.scalars().all()

async def create_space(db: AsyncSession, space_data: SpaceCreate):
    new_space = Space(**space_data.dict())
    db.add(new_space)
    await db.commit()
    await db.refresh(new_space)
    return new_space

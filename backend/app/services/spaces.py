from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models import spaces

async def get_spaces(db: AsyncSession):
    result = await db.execute(select(spaces))
    return result.scalars().all()

async def create_space(db: AsyncSession, space_data):
    new_space = spaces.insert().values(**space_data.dict())
    await db.execute(new_space)
    await db.commit()

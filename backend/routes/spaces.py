from fastapi import APIRouter, Depends
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

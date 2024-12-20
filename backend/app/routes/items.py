from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import SQLAlchemyError
from ..schemas import ItemCreate, Item
from ..models import Item as ItemModel
from ..utils.db import get_db

router = APIRouter()

@router.get("/", response_model=list[Item])
async def read_items(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(ItemModel))
        return result.scalars().all()
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=f"Error fetching items: {str(e)}")


@router.post("/", response_model=Item)
async def add_item(item: ItemCreate, db: AsyncSession = Depends(get_db)):
    try:
        new_item = ItemModel(**item.dict())
        db.add(new_item)
        await db.commit()
        await db.refresh(new_item)
        return new_item
    except SQLAlchemyError as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error adding item: {str(e)}")


@router.put("/{item_id}", response_model=Item)
async def update_item(item_id: int, item: ItemCreate, db: AsyncSession = Depends(get_db)):
    try:
        query = select(ItemModel).where(ItemModel.id == item_id)
        result = await db.execute(query)
        existing_item = result.scalar_one_or_none()

        if not existing_item:
            raise HTTPException(status_code=404, detail=f"Item with ID {item_id} not found")

        existing_item.name = item.name
        existing_item.description = item.description
        existing_item.space_id = item.space_id

        await db.commit()
        await db.refresh(existing_item)
        return existing_item
    except SQLAlchemyError as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating item: {str(e)}")


@router.delete("/{item_id}", response_model=dict)
async def delete_item(item_id: int, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(ItemModel).where(ItemModel.id == item_id))
        item = result.scalars().first()

        if not item:
            raise HTTPException(status_code=404, detail=f"Item with ID {item_id} not found")

        await db.delete(item)
        await db.commit()
        return {"message": f"Item with ID {item_id} deleted successfully"}
    except SQLAlchemyError as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting item: {str(e)}")

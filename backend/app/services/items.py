from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from ..models import Item as ItemModel
from ..schemas import ItemCreate, ItemUpdate

async def get_items(db: AsyncSession):
    """
    Fetch all items from the database.
    """
    try:
        result = await db.execute(select(ItemModel))
        return result.scalars().all()
    except Exception as e:
        raise RuntimeError(f"Error fetching items: {str(e)}")

async def create_item(db: AsyncSession, item_data: ItemCreate):
    """
    Create a new item in the database and return the full item model.
    """
    try:
        new_item = ItemModel(**item_data.dict())
        db.add(new_item)
        await db.commit()
        await db.refresh(new_item)
        return new_item
    except IntegrityError:
        await db.rollback()
        raise ValueError("Error adding item. Check if the space_id exists.")
    except Exception as e:
        await db.rollback()
        raise RuntimeError(f"Internal error while adding item: {str(e)}")

async def update_item(db: AsyncSession, item_id: int, item_data: ItemUpdate):
    """
    Update an existing item in the database.
    """
    try:
        query = select(ItemModel).where(ItemModel.id == item_id)
        result = await db.execute(query)
        item = result.scalar_one_or_none()

        if not item:
            return None

        if item_data.name is not None:
            item.name = item_data.name
        if item_data.description is not None:
            item.description = item_data.description
        if item_data.space_id is not None:
            item.space_id = item_data.space_id

        await db.commit()
        await db.refresh(item)
        return item
    except Exception as e:
        raise RuntimeError(f"Internal error while updating item: {str(e)}")

async def delete_item(db: AsyncSession, item_id: int):
    """
    Delete an item from the database.
    """
    try:
        result = await db.execute(select(ItemModel).where(ItemModel.id == item_id))
        item = result.scalars().first()

        if not item:
            return False

        await db.delete(item)
        await db.commit()
        return True
    except Exception as e:
        raise RuntimeError(f"Error deleting item: {str(e)}")

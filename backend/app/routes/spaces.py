from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from typing import List
from ..utils.db import get_db
from ..models import Space as SpaceModel
from ..schemas import Space, Item, SpaceCreate, SpaceUpdate
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

router = APIRouter()

@router.get("/", response_model=List[Space])
async def read_spaces(db: AsyncSession = Depends(get_db)):
    """
    Returns a flat list of all spaces.
    """
    try:
        result = await db.execute(
            select(SpaceModel)
            .options(joinedload(SpaceModel.children), joinedload(SpaceModel.items))
        )
        spaces = result.unique().scalars().all()

        response = [
            Space(
                id=space.id,
                name=space.name,
                parent_id=space.parent_id,
                depth=space.depth,
                created_at=space.created_at,
                updated_at=space.updated_at,
                children=[],  # Avoid recursion here
                items=[
                    Item(
                        id=item.id,
                        name=item.name,
                        description=item.description,
                        space_id=item.space_id,
                        created_at=item.created_at,
                        updated_at=item.updated_at,
                    )
                    for item in space.items
                ],
            )
            for space in spaces
        ]

        return response
    except Exception as e:
        print(f"Error reading spaces: {e}")
        raise HTTPException(status_code=500, detail="Error reading spaces.")


@router.get("/recursive", response_model=List[Space])
async def get_spaces_recursive(db: AsyncSession = Depends(get_db)):
    """
    Returns all spaces in a simple flat list, with items, but no nested children in the response.
    """
    try:
        result = await db.execute(
            select(SpaceModel)
            .options(joinedload(SpaceModel.items))
        )
        spaces = result.unique().scalars().all()

        response = [
            Space(
                id=space.id,
                name=space.name,
                parent_id=space.parent_id,
                depth=space.depth,
                created_at=space.created_at,
                updated_at=space.updated_at,
                children=[],  # No recursive children
                items=[
                    Item(
                        id=item.id,
                        name=item.name,
                        description=item.description,
                        space_id=item.space_id,
                        created_at=item.created_at,
                        updated_at=item.updated_at,
                    )
                    for item in space.items
                ],
            )
            for space in spaces
        ]

        return response
    except Exception as e:
        print(f"Error fetching recursive spaces: {e}")
        raise HTTPException(status_code=500, detail="Error fetching spaces.")


@router.get("/{id}/children", response_model=List[Space])
async def get_children(id: int, db: AsyncSession = Depends(get_db)):
    """
    Get immediate children of a given parent space ID, including items.
    """
    try:
        # Fetch spaces with parent_id = id
        result = await db.execute(
            select(SpaceModel)
            .where(SpaceModel.parent_id == id)
            .options(joinedload(SpaceModel.items))
        )
        spaces = result.unique().scalars().all()  # Ensure results are deduplicated

        response = [
            Space(
                id=space.id,
                name=space.name,
                parent_id=space.parent_id,
                depth=space.depth,
                created_at=space.created_at,
                updated_at=space.updated_at,
                children=[],  # Avoid deeper recursion
                items=[
                    Item(
                        id=item.id,
                        name=item.name,
                        description=item.description,
                        space_id=item.space_id,
                        created_at=item.created_at,
                        updated_at=item.updated_at
                    )
                    for item in space.items
                ]
            )
            for space in spaces
        ]
        
        return response

    except SQLAlchemyError as e:
        print(f"SQLAlchemy error fetching children for space ID {id}: {e}")
        raise HTTPException(status_code=500, detail="Database error while fetching children.")
    except Exception as e:
        print(f"Error fetching children for space ID {id}: {e}")
        raise HTTPException(status_code=500, detail="Unexpected error while fetching children.")


@router.post("/", response_model=Space)
async def create_space(space: SpaceCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a new space.
    """
    try:
        # Validate parent_id (if provided)
        if space.parent_id is not None:
            parent_exists = await db.execute(
                select(SpaceModel.id).where(SpaceModel.id == space.parent_id)
            )
            if not parent_exists.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Parent space does not exist.")

        new_space = SpaceModel(
            name=space.name,
            parent_id=space.parent_id,
            depth=space.depth,
        )

        db.add(new_space)
        await db.commit()
        await db.refresh(new_space)

        return Space(
            id=new_space.id,
            name=new_space.name,
            parent_id=new_space.parent_id,
            depth=new_space.depth,
            created_at=new_space.created_at,
            updated_at=new_space.updated_at,
            children=[],
            items=[]
        )
    except Exception as e:
        await db.rollback()
        print(f"Error creating space: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")


@router.put("/{id}", response_model=Space)
async def update_space(id: int, space_data: SpaceUpdate, db: AsyncSession = Depends(get_db)):
    """
    Update an existing space.
    """
    try:
        query = select(SpaceModel).where(SpaceModel.id == id)
        result = await db.execute(query)
        existing_space = result.scalar_one_or_none()

        if not existing_space:
            raise HTTPException(status_code=404, detail=f"Space with ID {id} not found")

        # If the update includes changing the parent, validate it
        if space_data.parent_id is not None:
            parent_exists = await db.execute(
                select(SpaceModel.id).where(SpaceModel.id == space_data.parent_id)
            )
            if not parent_exists.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="New parent space does not exist.")

        existing_space.name = space_data.name or existing_space.name
        if space_data.parent_id is not None:
            existing_space.parent_id = space_data.parent_id
        # If SpaceUpdate had depth changes, apply here if needed.
        # For now, assume only name and parent updates
        # If you want to allow depth updates:
        # existing_space.depth = space_data.depth or existing_space.depth

        await db.commit()
        await db.refresh(existing_space)

        return Space(
            id=existing_space.id,
            name=existing_space.name,
            parent_id=existing_space.parent_id,
            depth=existing_space.depth,
            created_at=existing_space.created_at,
            updated_at=existing_space.updated_at,
            children=[],
            items=[]
        )
    except Exception as e:
        await db.rollback()
        print(f"Error updating space ID {id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")


@router.delete("/{id}", response_model=dict)
async def delete_space(id: int, db: AsyncSession = Depends(get_db)):
    """
    Delete a space.
    """
    try:
        result = await db.execute(select(SpaceModel).where(SpaceModel.id == id))
        space = result.scalar_one_or_none()

        if not space:
            raise HTTPException(status_code=404, detail=f"Space with ID {id} not found")

        # If you need to ensure no children or items exist before deleting, check here.
        # Currently, cascade="all, delete-orphan" should handle removing children/items.
        await db.delete(space)
        await db.commit()
        return {"message": f"Space with ID {id} deleted successfully"}
    except Exception as e:
        await db.rollback()
        print(f"Error deleting space ID {id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")

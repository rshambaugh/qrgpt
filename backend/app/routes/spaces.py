from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from collections import defaultdict
from typing import List
from ..utils.db import get_db
from ..models import Space as SpaceModel
from ..schemas import Space, Item, SpaceCreate
from collections import defaultdict
from sqlalchemy.exc import IntegrityError
from sqlalchemy.sql import text


router = APIRouter()

@router.get("/", response_model=List[Space])
async def read_spaces(db: AsyncSession = Depends(get_db)):
    """
    Returns a flat list of all spaces.
    """
    try:
        # Fetch all spaces with joined children and items
        result = await db.execute(
            select(SpaceModel)
            .options(joinedload(SpaceModel.children), joinedload(SpaceModel.items))
        )

        # Use unique() to eliminate duplicates from joined eager loads
        spaces = result.unique().scalars().all()

        # Convert to Pydantic models
        response = [
            Space(
                id=space.id,
                name=space.name,
                parent_id=space.parent_id,
                depth=space.depth,
                created_at=space.created_at,
                updated_at=space.updated_at,
                children=[],  # Avoid recursive children here
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
    Returns all spaces in a simple flat list, without recursion.
    """
    try:
        # Fetch all spaces and their associated items (no recursion yet)
        result = await db.execute(
            select(SpaceModel)
            .options(joinedload(SpaceModel.items))
        )
        spaces = result.unique().scalars().all()

        # Build a flat response without recursion
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
    Get children spaces for a given parent space ID using raw SQL with `text`.
    """
    try:
        # Execute raw SQL for child spaces
        spaces_query = text("""
        SELECT id, name, parent_id, created_at, updated_at, depth
        FROM spaces
        WHERE parent_id = :parent_id
        """)
        result = await db.execute(spaces_query, {"parent_id": id})
        rows = result.fetchall()

        # Map rows into list of dicts for manual processing
        child_spaces = [
            {
                "id": row.id,
                "name": row.name,
                "parent_id": row.parent_id,
                "created_at": row.created_at,
                "updated_at": row.updated_at,
                "depth": row.depth,
                "children": [],
                "items": [],
            }
            for row in rows
        ]

        # Fetch items for each space
        for space in child_spaces:
            items_query = text("""
            SELECT id, name, description, space_id, created_at, updated_at
            FROM items
            WHERE space_id = :space_id
            """)
            result = await db.execute(items_query, {"space_id": space["id"]})
            items = result.fetchall()

            # Add items to the space
            space["items"] = [
                {
                    "id": item.id,
                    "name": item.name,
                    "description": item.description,
                    "space_id": item.space_id,
                    "created_at": item.created_at,
                    "updated_at": item.updated_at,
                }
                for item in items
            ]

        # Serialize manually into Pydantic models
        serialized_spaces = [Space(**space) for space in child_spaces]
        print(f"Serialized spaces: {serialized_spaces}")
        return serialized_spaces

    except Exception as e:
        print(f"Error fetching children for space ID {id}: {e}")
        raise HTTPException(status_code=500, detail="Error fetching children.")




@router.post("/", response_model=Space)
async def create_space(space: SpaceCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a new space.
    """
    try:
        # Validate parent_id (if provided)
        if space.parent_id:
            parent_exists = await db.execute(
                select(SpaceModel.id).where(SpaceModel.id == space.parent_id)
            )
            if not parent_exists.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Parent space does not exist.")

        # Create the new space
        new_space = SpaceModel(
            name=space.name,
            parent_id=space.parent_id,
            depth=space.depth,
        )

        db.add(new_space)
        await db.commit()
        await db.refresh(new_space)

        # Manually serialize the response to ensure proper children handling
        return Space(
            id=new_space.id,
            name=new_space.name,
            parent_id=new_space.parent_id,
            depth=new_space.depth,
            created_at=new_space.created_at,
            updated_at=new_space.updated_at,
            children=[],  # Explicitly return an empty list for children
            items=[],  # Explicitly return an empty list for items
        )
    except Exception as e:
        await db.rollback()
        print(f"Error creating space: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")

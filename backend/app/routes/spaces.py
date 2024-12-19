from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from collections import defaultdict
from ..utils.db import get_db
from ..models import Space as SpaceModel
from ..schemas import Space, SpaceCreate
from ..services.spaces import get_spaces, create_space
from sqlalchemy.orm import joinedload


router = APIRouter()

@router.get("/", response_model=list[Space])
async def read_spaces(db: AsyncSession = Depends(get_db)):
    """
    Returns a flat list of all spaces using the service function.
    """
    return await get_spaces(db)

@router.post("/", response_model=Space)
async def add_space(space: SpaceCreate, db: AsyncSession = Depends(get_db)):
    """
    Adds a new space to the database using the service function.
    """
    return await create_space(db, space)

@router.get("/recursive", response_model=list)
async def get_spaces_recursive(db: AsyncSession = Depends(get_db)):
    """
    Returns all spaces in a recursive/nested structure.
    """
    # Fetch all spaces
    result = await db.execute(select(SpaceModel))
    all_spaces = result.scalars().all()

    # Create a mapping of parent_id -> children
    space_map = defaultdict(list)
    for space in all_spaces:
        space_map[space.parent_id].append(space)

    # Recursive function to build the nested structure
    def build_tree(parent_id=None):
        return [
            {
                "id": space.id,
                "name": space.name,
                "parent_id": space.parent_id,
                "depth": space.depth,
                "created_at": space.created_at,
                "updated_at": space.updated_at,
                "children": build_tree(space.id),
            }
            for space in space_map[parent_id]
        ]

    # Return the top-level spaces as a list
    return build_tree(None)

from sqlalchemy.orm import joinedload

@router.get("/{space_id}/children", response_model=list[Space])
async def get_children(space_id: int, db: AsyncSession = Depends(get_db)):
    """
    Fetches all child spaces for the given parent space ID.
    """
    # Query for spaces with the given parent_id and eagerly load relationships
    result = await db.execute(
        select(SpaceModel).where(SpaceModel.parent_id == space_id).options(joinedload(SpaceModel.children))
    )
    children = result.scalars().all()

    # Explicitly convert the children objects to dictionaries if needed
    return children

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import joinedload
from collections import defaultdict
from ..models import Space, Item
from ..schemas import SpaceCreate, Space

async def fetch_spaces(db: AsyncSession):
    """
    Fetch all spaces from the database.
    """
    result = await db.execute(select(Space))
    return result.scalars().all()

async def create_space(db: AsyncSession, space_data: SpaceCreate):
    """
    Create a new space in the database.
    """
    new_space = Space(**space_data.dict())
    db.add(new_space)
    await db.commit()
    await db.refresh(new_space)
    return new_space

async def get_space_tree(db: AsyncSession):
    """
    Fetch all spaces and build a nested tree structure.
    """
    result = await db.execute(
        select(Space).options(joinedload(Space.children), joinedload(Space.items))
    )
    all_spaces = result.scalars().all()

    space_map = defaultdict(list)
    for space in all_spaces:
        space_map[space.parent_id].append(space)

    def build_tree(parent_id=None):
        children = space_map.get(parent_id, [])
        return [
            {
                "id": space.id,
                "name": space.name,
                "parent_id": space.parent_id,
                "depth": space.depth,
                "created_at": space.created_at,
                "updated_at": space.updated_at,
                "children": build_tree(space.id),
                "items": [
                    {
                        "id": item.id,
                        "name": item.name,
                        "description": item.description,
                        "space_id": item.space_id,
                        "created_at": item.created_at,
                        "updated_at": item.updated_at,
                    }
                    for item in space.items
                ],
            }
            for space in children
        ]

    return build_tree(None)

async def get_children(db: AsyncSession, parent_id: int):
    """
    Fetch all child spaces and items for a given parent space ID.
    """
    result = await db.execute(
        select(Space).options(joinedload(Space.children), joinedload(Space.items)).where(Space.parent_id == parent_id)
    )
    children = result.scalars().all()

    return [
        {
            "id": space.id,
            "name": space.name,
            "parent_id": space.parent_id,
            "depth": space.depth,
            "created_at": space.created_at,
            "updated_at": space.updated_at,
            "children": [],
            "items": [
                {
                    "id": item.id,
                    "name": item.name,
                    "description": item.description,
                    "space_id": item.space_id,
                    "created_at": item.created_at,
                    "updated_at": item.updated_at,
                }
                for item in space.items
            ],
        }
        for space in children
    ]

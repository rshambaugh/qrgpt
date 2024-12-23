from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ConfigBase:
    from_attributes = True  # Enable compatibility with SQLAlchemy models
    json_encoders = {
        datetime: lambda v: v.isoformat(),  # Serialize datetime to ISO format
    }

# Item schemas
class ItemBase(BaseModel):
    name: str
    description: Optional[str] = None

class ItemCreate(ItemBase):
    space_id: Optional[int] = None

# Use this for updating items
class ItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    space_id: Optional[int] = None

class Item(ItemBase):
    id: int
    space_id: Optional[int]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config(ConfigBase):
        pass

# Space schemas
class SpaceBase(BaseModel):
    name: str

class SpaceCreate(BaseModel):
    name: str
    parent_id: Optional[int] = None
    depth: int = 0

class SpaceUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[int] = None

class Space(SpaceBase):
    id: int
    parent_id: Optional[int]
    depth: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    children: List["Space"] = []
    items: List[Item] = []

    class Config(ConfigBase):
        pass

Space.update_forward_refs()

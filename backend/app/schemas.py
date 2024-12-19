# backend/app/schemas.py
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime  # Ensure you import datetime


# Shared configuration for schemas
class ConfigBase:
    orm_mode = True  # Enables compatibility with SQLAlchemy models
    json_encoders = {
        datetime: lambda v: v.isoformat(),  # Serialize datetime to ISO format
    }


# Item schemas
class ItemBase(BaseModel):
    name: str
    description: Optional[str] = None


class ItemCreate(ItemBase):
    space_id: Optional[int] = None


class ItemUpdate(ItemBase):
    space_id: Optional[int] = None


class Item(ItemBase):
    id: int
    space_id: Optional[int]
    created_at: Optional[datetime]  # Use datetime instead of string
    updated_at: Optional[datetime]  # Use datetime instead of string

    class Config(ConfigBase):
        pass


# Space schemas
class SpaceBase(BaseModel):
    name: str


class SpaceCreate(SpaceBase):
    parent_id: Optional[int] = None


class SpaceUpdate(SpaceBase):
    pass


class Space(SpaceBase):
    id: int
    parent_id: Optional[int]
    depth: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    children: List["Space"] = []  # Recursive reference to child spaces
    items: List[Item] = []  # List of associated items

    class Config(ConfigBase):
        pass


# Update forward references for recursive models
Space.update_forward_refs()

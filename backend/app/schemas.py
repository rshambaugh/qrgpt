from pydantic import BaseModel
from typing import Optional, List

class SpaceBase(BaseModel):
    name: str
    description: Optional[str] = None

class SpaceCreate(SpaceBase):
    parent_id: Optional[int] = None

class Space(SpaceBase):
    id: int
    parent_id: Optional[int]

    class Config:
        orm_mode = True

class ItemBase(BaseModel):
    name: str
    description: Optional[str] = None

class ItemCreate(ItemBase):
    space_id: int

class Item(ItemBase):
    id: int
    space_id: int

    class Config:
        orm_mode = True

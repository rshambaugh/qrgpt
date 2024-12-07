# backend/models.py

from typing import List, Optional
from pydantic import BaseModel

class Item(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    space_id: Optional[int] = None

class Space(BaseModel):
    id: int
    name: str
    parent_id: Optional[int] = None
    depth: int
    children: List['Space'] = []
    items: List[Item] = []

    class Config:
        orm_mode = True

Space.update_forward_refs()

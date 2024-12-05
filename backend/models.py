from pydantic import BaseModel
from sqlalchemy import Table, Column, Integer, String, ForeignKey, MetaData

# SQLAlchemy metadata
metadata = MetaData()

# Table definitions
items_table = Table(
    "items",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String, nullable=False),
    Column("description", String),
    Column("space_id", Integer, ForeignKey("spaces.id"), nullable=True),
)

spaces_table = Table(
    "spaces",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String, nullable=False),
    Column("parent_id", Integer, ForeignKey("spaces.id"), nullable=True),
)

# Pydantic models
class Item(BaseModel):
    id: int
    name: str
    description: str | None = None
    space_id: int | None = None

    class Config:
        orm_mode = True

class Space(BaseModel):
    id: int
    name: str
    parent_id: int | None = None

    class Config:
        orm_mode = True

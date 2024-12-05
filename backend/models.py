from sqlalchemy import Column, Integer, String, ForeignKey, MetaData, Table
from sqlalchemy.orm import relationship

metadata = MetaData()

spaces = Table(
    "spaces",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String, nullable=False),
    Column("description", String, nullable=True),
    Column("parent_id", Integer, ForeignKey("spaces.id"), nullable=True),
)

items = Table(
    "items",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String, nullable=False),
    Column("description", String, nullable=True),
    Column("space_id", Integer, ForeignKey("spaces.id"), nullable=False),
)

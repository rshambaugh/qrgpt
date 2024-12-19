# backend/app/models.py
from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime, func, text
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class Space(Base):
    __tablename__ = "spaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text, nullable=False)
    parent_id = Column(Integer, ForeignKey("spaces.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), nullable=False)
    depth = Column(Integer, nullable=False, server_default=text("0"))

    # Self-referential relationship for nested spaces
    children = relationship("Space", backref="parent", remote_side=[id])

    # Relationship to items
    items = relationship("Item", back_populates="space")

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    space_id = Column(Integer, ForeignKey("spaces.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Link back to Space
    space = relationship("Space", back_populates="items")

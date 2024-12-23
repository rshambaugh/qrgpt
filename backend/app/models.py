from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime, func, text
from sqlalchemy.orm import relationship, declarative_base

# Initialize the declarative base for SQLAlchemy models
Base = declarative_base()

class Space(Base):
    __tablename__ = "spaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text, nullable=False)
    parent_id = Column(Integer, ForeignKey("spaces.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), nullable=False, onupdate=func.now())
    depth = Column(Integer, nullable=False, server_default=text("0"))

    # Self-referential relationship for nested spaces
    children = relationship(
        "Space",
        backref="parent",
        remote_side=[id],
        cascade="all, delete-orphan",
        single_parent=True,
        passive_deletes=True,
        lazy="joined",  # Ensures children are eagerly loaded
    )

    # Relationship to items
    items = relationship(
        "Item",
        back_populates="space",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy="joined",  # Ensures items are eagerly loaded
    )


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    space_id = Column(Integer, ForeignKey("spaces.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), nullable=False, onupdate=func.now())

    # Link back to Space
    space = relationship("Space", back_populates="items")

    def __repr__(self):
        return f"<Item(id={self.id}, name='{self.name}', description='{self.description}', space_id={self.space_id})>"

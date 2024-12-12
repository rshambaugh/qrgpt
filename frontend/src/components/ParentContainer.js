import React, { useEffect } from "react";
import { useDrop } from "react-dnd";
import Space from "./Space";

const ParentContainer = ({
  spaces,
  items,
  onDrop,
  onSpaceClick,
  currentSpaceId,
  viewMode,
  onDeleteItem,
  onDeleteSpace
}) => {
  useEffect(() => {
    console.log("Updated spaces in ParentContainer:", spaces);
  }, [spaces]);

  const [{ isOver }, drop] = useDrop({
    accept: ["ITEM", "SPACE"],
    drop: (draggedItem, monitor) => {
      // Dropping on ParentContainer means no parent (top-level)
      if (!monitor.didDrop()) {
        onDrop(draggedItem.id, null, monitor.getItemType());
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Determine the starting parentId based on viewMode
  const startingParentId = viewMode === "list" ? null : currentSpaceId;

  const renderSpaces = (parentId) => {
    return spaces
      .filter((space) => space.parent_id === parentId)
      .map((space) => (
        <Space
          key={space.id}
          space={space}
          items={items.filter((item) => item.space_id === space.id)}
          onDrop={onDrop}
          onSpaceClick={onSpaceClick}
          onDeleteItem={onDeleteItem}
          onDeleteSpace={onDeleteSpace}
        />
      ));
  };

  return (
    <div
      ref={drop}
      style={{
        padding: "20px",
        border: isOver ? "2px dashed #007bff" : "1px solid #ccc",
        backgroundColor: isOver ? "#f0f8ff" : "#f9f9f9",
      }}
    >
      <h2>Spaces (drop a space here to move it top-level)</h2>
      {renderSpaces(startingParentId)}
    </div>
  );
};

export default ParentContainer;

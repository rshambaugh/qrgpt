import React, { useEffect } from "react";
import { useDrop } from "react-dnd";
import Space from "./Space";

const ParentContainer = ({ spaces, items, onDrop, onSpaceClick, onSpaceHover, currentSpaceId, viewMode, onDeleteSpace, onDeleteItem }) => {
  useEffect(() => {
    console.log("Updated spaces in ParentContainer:", spaces);
  }, [spaces]);

  const [{ isOver }, drop] = useDrop({
    accept: ["ITEM", "SPACE"],
    drop: (draggedItem, monitor) => {
      if (!monitor.didDrop()) {
        onDrop(draggedItem.id, null, draggedItem.type);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

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
          onDeleteSpace={onDeleteSpace}
          onSpaceHover={onSpaceHover} // Pass down to Space
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
        marginBottom: "20px"
      }}
    >
      <h2 style={{ marginTop: 0 }}>Spaces (drop space here for top-level)</h2>
      {renderSpaces(startingParentId)}
    </div>
  );
};

export default ParentContainer;

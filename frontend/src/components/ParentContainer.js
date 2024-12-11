import React from "react";
import { useDrop } from "react-dnd";
import Space from "./Space";

const ParentContainer = ({ spaces, items, onDrop }) => {
  const [{ isOver }, drop] = useDrop({
    accept: ["ITEM", "SPACE"],
    drop: (draggedItem, monitor) => {
      if (!monitor.didDrop()) {
        const targetSpaceId = space ? space.id : null;
        console.log("Dropping item:", { draggedItem, targetSpaceId });
        onDrop(draggedItem.id, targetSpaceId, monitor.getItemType());
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });
  
  
  

  const renderSpaces = (parentId) => {
    console.log("Rendering spaces for parent ID:", parentId);
    return spaces
      .filter((space) => space.parent_id === parentId)
      .map((space) => {
        console.log("Space:", space);
        return (
          <Space
            key={space.id}
            space={space}
            items={items.filter((item) => item.space_id === space.id)}
            onDrop={onDrop}
          >
            {renderSpaces(space.id)}
          </Space>
        );
      });
  };
  

  return (
    <div
      ref={drop}
      onDrop={(e) => e.preventDefault()} // Prevent default behavior to avoid page reload
      style={{
        padding: "20px",
        border: isOver ? "2px dashed #007bff" : "1px solid #ccc",
        backgroundColor: isOver ? "#f0f8ff" : "#f9f9f9",
      }}
    >
      <h2>Spaces</h2>
      {renderSpaces(null)}
    </div>
  );
};

export default ParentContainer;

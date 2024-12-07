import React from "react";
import { useDrag, useDrop } from "react-dnd"; // Import hooks for drag-and-drop functionality

const Space = ({ space, items, children, onDrop }) => {
  // Make the space draggable
  const [{ isDragging }, drag] = useDrag({
    type: "SPACE", // Must match "accept" in useDrop
    item: { id: space.id, type: "SPACE" },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Make the space a drop target
  const [{ isOver }, drop] = useDrop({
    accept: ["ITEM", "SPACE"],
    drop: (draggedItem) => {
      if (draggedItem.type === "ITEM") {
        onDrop(draggedItem.id, space.id, "item");
      } else if (draggedItem.type === "SPACE") {
        onDrop(draggedItem.id, space.id, "space");
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={(node) => drag(drop(node))} // Combine drag and drop refs
      className={`space ${isOver ? "space-hover" : ""}`}
      style={{
        opacity: isDragging ? 0.5 : 1, // Visual feedback while dragging
        cursor: "move", // Show move cursor
      }}
    >
      <div className="space-title">
        <span>{space.name}</span>
        <button
          className="delete-button"
          onClick={() => onDrop(space.id, null, "delete-space")}
        >
          Delete
        </button>
      </div>
      <div className="space-children">{children}</div>
      <div className="space-items">
        {items.map((item) => (
          <div key={item.id} className="item">
            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
};

// Properly export the Space component
export default Space;

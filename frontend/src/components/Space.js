import React, { useState } from "react";
import { useDrop } from "react-dnd";
import Item from "./Item"; // Import the Item component

const Space = ({ space, items, onDrop }) => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = () => setCollapsed(!collapsed);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "ITEM",
    canDrop: (draggedItem) => draggedItem.space_id !== space.id, // Prevent dropping into the same space
    drop: (draggedItem, monitor) => {
      if (!monitor.didDrop()) {
        console.log(`Item dropped: ${draggedItem.id} on space: ${space.id}`);
        onDrop(draggedItem.id, space.id, "item");
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={drop}
      className="space"
      style={{
        border: isOver ? "2px dashed green" : "1px solid gray",
        backgroundColor: isOver && canDrop ? "#e0ffe0" : "#f9f9f9",
        marginBottom: "10px",
        padding: "10px",
        transition: "background-color 0.3s ease",
      }}
    >
      <div className="space-header">
        <span
          onClick={toggleCollapse}
          style={{ cursor: "pointer", fontWeight: "bold" }}
        >
          {collapsed ? "+" : "-"} {space.name}
        </span>
      </div>
      {!collapsed && (
        <div>
          {items.map((item) => (
            <Item key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Space;

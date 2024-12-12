import React from "react";
import { useDrag, useDrop } from "react-dnd";

function Space({ space, items, onDrop, onSpaceClick, onDeleteItem, onDeleteSpace }) {
  const [{ isDragging }, drag] = useDrag({
    type: "SPACE",
    item: { id: space.id, type: "SPACE" },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ["ITEM", "SPACE"],
    drop: (draggedItem, monitor) => {
      if (!monitor.didDrop()) {
        if (draggedItem.type === "item") {
          onDrop(draggedItem.id, space.id, "item");
        } else if (draggedItem.type === "SPACE") {
          onDrop(draggedItem.id, space.id, "space");
        }
      }
    },
    canDrop: (draggedItem) => {
      if (draggedItem.type === "SPACE" && draggedItem.id === space.id) {
        return false;
      }
      return true;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      style={{
        border: isOver ? "2px dashed green" : "1px solid gray",
        backgroundColor: isOver && canDrop ? "#e0ffe0" : "white",
        opacity: isDragging ? 0.5 : 1,
        padding: "10px",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        width: "200px",
        marginBottom: "10px",
        textAlign: "center",
      }}
    >
      <h4
        onClick={() => onSpaceClick && onSpaceClick(space.id)}
        style={{ cursor: "pointer", margin: 0 }}
      >
        {space.name}
      </h4>

      <button
        onClick={() => onDeleteSpace && onDeleteSpace(space.id)}
        style={{ marginTop: "5px", marginBottom: "10px" }}
      >
        Delete Space
      </button>

      <div style={{ marginTop: "10px" }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              margin: "5px 0",
              padding: "5px",
              backgroundColor: "#ffc",
              borderRadius: "4px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "move",
            }}
          >
            <span>{item.name}</span>
            <button onClick={() => onDeleteItem && onDeleteItem(item.id)}>X</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Space;

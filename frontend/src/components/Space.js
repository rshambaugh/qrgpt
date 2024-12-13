import React, { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { FaTrash, FaEdit } from "react-icons/fa";

function Space({ space, items, onDrop, onSpaceClick, onDeleteSpace, onSpaceHover }) {
  const hoverTimeoutRef = useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: "SPACE",
    item: { id: space.id, type: "SPACE" },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ["ITEM", "SPACE"],
    hover: (draggedItem, monitor) => {
      // If we can drop here and not currently pressing mouse button
      // and we have a hover callback:
      if (canDrop && monitor.isOver({ shallow: true }) && draggedItem && onSpaceHover) {
        if (!hoverTimeoutRef.current) {
          // Set a timer to navigate after delay
          hoverTimeoutRef.current = setTimeout(() => {
            onSpaceHover(space.id);
          }, 1000);
        }
      }
    },
    drop: (draggedItem, monitor) => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      if (!monitor.didDrop()) {
        if (draggedItem.type === "ITEM") {
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
  },
  );

  // Clear timer if user moves away
  if (!isOver && hoverTimeoutRef.current) {
    clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = null;
  }

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDeleteSpace) {
      onDeleteSpace(space.id);
    }
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    alert("Edit space not implemented yet!");
  };

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
        position: "relative"
      }}
      onClick={() => onSpaceClick && onSpaceClick(space.id)}
    >
      <div style={{ position: "absolute", top: "5px", right: "5px", display: "flex", gap: "5px" }}>
        <FaEdit style={{ cursor: "pointer" }} onClick={handleEditClick} />
        <FaTrash style={{ cursor: "pointer" }} onClick={handleDeleteClick} />
      </div>

      <h4 style={{ margin: 0, cursor: "pointer" }}>{space.name}</h4>

      <div style={{ marginTop: "10px" }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              margin: "5px 0",
              padding: "5px",
              backgroundColor: "#ffc",
              borderRadius: "4px",
              cursor: "move",
            }}
          >
            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Space;

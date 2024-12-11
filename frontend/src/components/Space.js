import React from "react";
import { useDrag, useDrop } from "react-dnd"; // Import useDrag and useDrop from react-dnd

const Space = ({ space, items, onDrop, viewSpace }) => {
  const [{ isDragging }, drag] = useDrag({
    type: "SPACE",
    item: { id: space.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ["ITEM", "SPACE"],
    drop: (draggedItem, monitor) => {
      if (!monitor.didDrop()) {
        onDrop(draggedItem.id, space.id, monitor.getItemType());
      }
    },
    canDrop: (draggedItem) => draggedItem.id !== space.id,
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
        cursor: "pointer",
      }}
      onClick={() => viewSpace(space.id)} // Trigger viewSpace on click
    >
      <h4>{space.name}</h4>

      <div style={{ marginTop: "10px" }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              margin: "5px 0",
              padding: "5px",
              backgroundColor: "#ffc",
              borderRadius: "4px",
              cursor: "grab",
            }}
          >
            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Space;

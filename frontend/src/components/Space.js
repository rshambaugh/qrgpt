import React from "react";
import { useDrag, useDrop } from "react-dnd";

const Space = ({ space, items, onDrop, children = [] }) => {
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
    canDrop: (draggedItem) => draggedItem.id !== space.id, // Prevent dropping on itself
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
      <h4>{space.name}</h4>

      {/* Render items in this space */}
      <div style={{ marginTop: "10px" }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              margin: "5px 0",
              padding: "5px",
              backgroundColor: "#ffc",
              cursor: "grab",
            }}
          >
            {item.name}
          </div>
        ))}
      </div>

      {/* Render child spaces */}
      {children.length > 0 && (
        <div style={{ marginTop: "15px" }}>
          {children.map((childSpace) => (
            <Space
              key={childSpace.id}
              space={childSpace}
              items={items.filter((item) => item.space_id === childSpace.id)}
              onDrop={onDrop}
              children={childSpace.children || []} // Pass down children recursively
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Space;

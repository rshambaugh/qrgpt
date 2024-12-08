import React from "react";
import { useDrop } from "react-dnd";
import Space from "./Space"; // Adjust this import if needed

const ParentContainer = ({ spaces, items, onDrop }) => {
  const [{ isOver }, drop] = useDrop({
    accept: ["ITEM", "SPACE"],
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      style={{
        padding: "20px",
        border: isOver ? "2px dashed #007bff" : "1px solid #ccc",
        backgroundColor: isOver ? "#f0f8ff" : "#f9f9f9",
      }}
    >
      <h2>Spaces</h2>
      {spaces.map((space) => (
        <Space
          key={space.id}
          space={space}
          items={items.filter((item) => item.space_id === space.id)}
          onDrop={onDrop}
        />
      ))}
    </div>
  );
};

export default ParentContainer;

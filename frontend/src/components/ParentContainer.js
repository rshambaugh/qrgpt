import React, { useEffect } from "react";
import { useDrop } from "react-dnd";
import Space from "./Space";

const ParentContainer = ({ spaces, items, onDrop }) => {
  // Log spaces whenever they update
  useEffect(() => {
    console.log("Updated spaces in ParentContainer:", spaces);
  }, [spaces]);

  const [{ isOver }, drop] = useDrop({
    accept: ["ITEM", "SPACE"],
    drop: (draggedItem, monitor) => {
      if (!monitor.didDrop()) {
        onDrop(draggedItem.id, null, monitor.getItemType());
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const renderSpaces = (parentId) => {
    return spaces
      .filter((space) => space.parent_id === parentId)
      .map((space) => (
        <Space
          key={space.id}
          space={space}
          items={items.filter((item) => item.space_id === space.id)}
          onDrop={onDrop}
          spaces={spaces} // Pass all spaces to each Space component
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
      <h2>Spaces</h2>
      {renderSpaces(null)}
    </div>
  );
};

export default ParentContainer;

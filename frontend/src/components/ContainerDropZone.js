import React from "react";
import { useDrop } from "react-dnd";

const ContainerDropZone = ({ container, onDrop }) => {
  const [{ isOver }, dropRef] = useDrop(() => ({
    accept: "ITEM",
    drop: (draggedItem) => onDrop(container.id, draggedItem.id),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={dropRef}
      style={{
        border: "2px dashed gray",
        backgroundColor: isOver ? "lightblue" : "white",
        padding: "20px",
        margin: "10px",
      }}
    >
      <h3>{container.name}</h3>
      <p>Location: {container.location}</p>
    </div>
  );
};

export default ContainerDropZone;

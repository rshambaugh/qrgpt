import React from "react";
import { useDrag } from "react-dnd";

const Item = ({ item }) => {
  const [{ isDragging }, drag] = useDrag({
    type: "ITEM",
    item: { id: item.id }, // Ensure this is accurate
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });


  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        padding: "8px",
        margin: "5px",
        backgroundColor: "#fff",
        border: "1px solid #ddd",
        borderRadius: "4px",
        cursor: "move",
      }}
    >
      {item.name}
    </div>
  );
};

export default Item;

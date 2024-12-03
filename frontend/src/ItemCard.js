import React from "react";
import { useDrag } from "react-dnd";

const ItemCard = ({ item }) => {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: "ITEM",
    item: { id: item.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={dragRef}
      style={{
        opacity: isDragging ? 0.5 : 1,
        border: "1px solid gray",
        padding: "10px",
        margin: "5px",
        backgroundColor: "#f9f9f9",
      }}
    >
      <p><strong>{item.name}</strong></p>
      <p>{item.description}</p>
    </div>
  );
};

export default ItemCard;

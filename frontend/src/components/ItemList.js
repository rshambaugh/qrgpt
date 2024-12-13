import React from "react";
import { useDrop } from "react-dnd";
import Item from "./Item";

const ItemList = ({ items, onDrop, onItemClick, onDeleteItem }) => {
  const [{ isOver }, drop] = useDrop({
    accept: ["ITEM"],
    drop: (draggedItem, monitor) => {
      if (!monitor.didDrop()) {
        // Dropping on ItemList (not in a space) means top-level
        onDrop(draggedItem.id, null);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      style={{
        border: isOver ? "2px dashed #007bff" : "1px solid #ccc",
        padding: "10px",
        borderRadius: "4px",
        backgroundColor: "#f9f9f9",
        marginTop: "20px"
      }}
    >
      <h2 style={{ marginTop: 0 }}>Items (drop here to move to top-level)</h2>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {items.map((item) => (
          <Item
            key={item.id}
            item={item}
            onItemClick={onItemClick}
            onDeleteItem={onDeleteItem}
          />
        ))}
      </div>
    </div>
  );
};

export default ItemList;

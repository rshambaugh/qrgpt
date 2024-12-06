import React from "react";
import { useDrag } from "react-dnd";

const Item = ({ item, onDelete }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "ITEM",
    item: { id: item.id, type: "item" },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  return (
    <div ref={drag} className={`item ${isDragging ? "item-dragging" : ""}`}>
      {item.name}
      <button className="delete-button" onClick={() => onDelete(item.id)}>
        Delete
      </button>
    </div>
  );
};

const ItemList = ({ items, onDrop }) => (
  <div className="item-list">
    {items.map((item) => (
      <Item key={item.id} item={item} onDelete={(id) => onDrop(id, null)} />
    ))}
  </div>
);

export default ItemList;

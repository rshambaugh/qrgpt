import React from "react";
import { useDrag } from "react-dnd";
import { FaTrash, FaEdit } from "react-icons/fa";

const Item = ({ item, onItemClick, onDeleteItem, onEditItem }) => {
  const [{ isDragging }, drag] = useDrag({
    type: "ITEM",
    item: { id: item.id, type: "ITEM" },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDeleteItem(item.id);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    onEditItem(item.id, item.name, item.description || "");
  };

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: "#fff",
        border: "1px solid #ddd",
        borderRadius: "4px",
        padding: "5px",
        margin: "5px",
        cursor: "move",
        position: "relative"
      }}
      onClick={() => onItemClick && onItemClick(item)}
    >
      <div style={{ position: "absolute", top: "5px", right: "5px", display: "flex", gap: "5px" }}>
        <FaEdit style={{ cursor: "pointer" }} onClick={handleEditClick} />
        <FaTrash style={{ cursor: "pointer" }} onClick={handleDeleteClick} />
      </div>
      {item.name}
    </div>
  );
};

export default Item;

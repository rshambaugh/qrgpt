import React, { useState } from "react";
import { useDrag, useDrop } from "react-dnd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";

const ItemList = ({ items, spaces, onDrop, onDeleteItem, onEditItem, onDeleteSpace, onEditSpace, onSpaceClick }) => {
  const [editingItemId, setEditingItemId] = useState(null);
  const [editedItemName, setEditedItemName] = useState("");
  const [editedItemDesc, setEditedItemDesc] = useState("");

  // Ensure spaces is an array
  const safeSpaces = Array.isArray(spaces) ? spaces : [];

  const DraggableItem = ({ item }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: "ITEM",
      item: { id: item.id, type: "ITEM" },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }));

    return (
      <div
        ref={drag}
        style={{
          margin: "10px 0",
          padding: "10px",
          backgroundColor: "#f9f9a9",
          borderRadius: "4px",
          opacity: isDragging ? 0.5 : 1,
          position: "relative",
        }}
      >
        {editingItemId === item.id ? (
          <form onSubmit={(e) => handleItemEditSubmit(e, item.id)}>
            <input
              type="text"
              value={editedItemName}
              onChange={(e) => setEditedItemName(e.target.value)}
              style={{ width: "100%", marginBottom: "5px" }}
            />
            <textarea
              value={editedItemDesc}
              onChange={(e) => setEditedItemDesc(e.target.value)}
              style={{ width: "100%", marginBottom: "5px" }}
            />
            <button type="submit">Save</button>
            <button type="button" onClick={() => setEditingItemId(null)}>
              Cancel
            </button>
          </form>
        ) : (
          <>
            <div>
              <strong>{item.name}</strong>
            </div>
            {item.description && <div>{item.description}</div>}
            <div
              style={{ position: "absolute", top: "5px", right: "5px", display: "flex", gap: "5px" }}
            >
              <FontAwesomeIcon
                icon={faEdit}
                style={{ cursor: "pointer", color: "blue" }}
                onClick={() => handleItemEditStart(item)}
              />
              <FontAwesomeIcon
                icon={faTrash}
                style={{ cursor: "pointer", color: "red" }}
                onClick={() => onDeleteItem(item.id)}
              />
            </div>
          </>
        )}
      </div>
    );
  };

  const DroppableSpace = ({ space }) => {
    const [, drop] = useDrop(() => ({
      accept: ["ITEM", "SPACE"],
      drop: (draggedItem) => onDrop(draggedItem.id, space.id, draggedItem.type),
    }));

    return (
      <div
        ref={drop}
        onClick={() => onSpaceClick && onSpaceClick(space.id)}
        style={{
          margin: "10px 0",
          padding: "10px",
          backgroundColor: "#e0f7ff",
          borderRadius: "4px",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <strong>{space.name}</strong>
        <div style={{ display: "flex", gap: "10px" }}>
          <FontAwesomeIcon
            icon={faEdit}
            style={{ cursor: "pointer", color: "blue" }}
            onClick={() => onEditSpace && onEditSpace(space.id, space.name)}
          />
          <FontAwesomeIcon
            icon={faTrash}
            style={{ cursor: "pointer", color: "red" }}
            onClick={() => onDeleteSpace && onDeleteSpace(space.id)}
          />
        </div>
      </div>
    );
  };

  const handleItemEditStart = (item) => {
    setEditingItemId(item.id);
    setEditedItemName(item.name);
    setEditedItemDesc(item.description || "");
  };

  const handleItemEditSubmit = (e, itemId) => {
    e.preventDefault();
    onEditItem && onEditItem(itemId, editedItemName, editedItemDesc);
    setEditingItemId(null);
  };

  return (
    <div
      style={{
        flex: 1,
        border: "1px solid #ccc",
        padding: "20px",
        overflowY: "auto",
      }}
    >
      <h2>Spaces</h2>
      {safeSpaces.map((space) => (
        <DroppableSpace key={space.id} space={space} />
      ))}

      <h2>Items</h2>
      {items && items.map((item) => <DraggableItem key={item.id} item={item} />)}
    </div>
  );
};

export default ItemList;

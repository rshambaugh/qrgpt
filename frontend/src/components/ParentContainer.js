import React, { useState } from 'react';
import { useDrag } from 'react-dnd';

function DraggableItem({ item, onDeleteItem, onEditItem }) {
  const [{ isDragging }, drag] = useDrag({
    type: "ITEM",
    item: { id: item.id, type: "ITEM" },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [editing, setEditing] = useState(false);
  const [editedName, setEditedName] = useState(item.name);
  const [editedDesc, setEditedDesc] = useState(item.description || "");

  const handleEditSubmit = (e) => {
    e.preventDefault();
    onEditItem(item.id, editedName, editedDesc);
    setEditing(false);
  };

  return (
    <div
      ref={drag}
      style={{
        margin: "10px 0",
        padding: "10px",
        backgroundColor: "#f9f9a9",
        borderRadius: "4px",
        opacity: isDragging ? 0.5 : 1,
        position: "relative"
      }}
    >
      {editing ? (
        <form onSubmit={handleEditSubmit}>
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            style={{ width: "100%", marginBottom: "5px" }}
          />
          <textarea
            value={editedDesc}
            onChange={(e) => setEditedDesc(e.target.value)}
            style={{ width: "100%", marginBottom: "5px" }}
          />
          <button type="submit">Save</button>
          <button type="button" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </form>
      ) : (
        <>
          <div><strong>{item.name}</strong></div>
          {item.description && <div>{item.description}</div>}
          <div
            style={{
              position: "absolute",
              top: "5px",
              right: "5px",
              display: "flex",
              gap: "5px"
            }}
          >
            <span
              style={{ cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
            >
              ✏️
            </span>
            <span
              style={{ cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteItem(item.id);
              }}
            >
              🗑️
            </span>
          </div>
        </>
      )}
    </div>
  );
}

const ItemList = ({ items, onDeleteItem, onEditItem }) => {
  return (
    <div
      style={{
        flex: 1,
        border: "1px solid #ccc",
        padding: "20px",
        overflowY: "auto"
      }}
    >
      <h2>Items</h2>
      {items.map((item) => (
        <DraggableItem
          key={item.id}
          item={item}
          onDeleteItem={onDeleteItem}
          onEditItem={onEditItem}
        />
      ))}
    </div>
  );
};

export default ItemList;

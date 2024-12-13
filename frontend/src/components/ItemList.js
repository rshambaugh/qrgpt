import React, { useState } from 'react';
import { useDrag } from 'react-dnd';

const ItemList = ({ items, onDrop, currentSpaceId, onDeleteItem, onEditItem }) => {
  // Inline edit states per item
  const [editingItemId, setEditingItemId] = useState(null);
  const [editedItemName, setEditedItemName] = useState("");
  const [editedItemDesc, setEditedItemDesc] = useState("");

  const handleItemEditStart = (item) => {
    setEditingItemId(item.id);
    setEditedItemName(item.name);
    setEditedItemDesc(item.description || "");
  };

  const handleItemEditSubmit = (e, itemId) => {
    e.preventDefault();
    onEditItem(itemId, editedItemName, editedItemDesc);
    setEditingItemId(null);
  };

  return (
    <div style={{ flex: 1, border: "1px solid #ccc", padding: "20px", overflowY: "auto" }}>
      <h2>Items</h2>
      {items.map(item => {
        const [{ isDragging }, drag] = useDrag({
          type: "ITEM",
          item: { id: item.id, type: "ITEM" },
          collect: (monitor) => ({
            isDragging: monitor.isDragging(),
          }),
        });

        return (
          <div
            key={item.id}
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
                <div><strong>{item.name}</strong></div>
                {item.description && <div>{item.description}</div>}
                <div style={{ position: "absolute", top: "5px", right: "5px", display: "flex", gap: "5px" }}>
                  <i
                    className="fas fa-edit"
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemEditStart(item);
                    }}
                  ></i>
                  <i
                    className="fas fa-trash"
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteItem(item.id);
                    }}
                  ></i>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ItemList;

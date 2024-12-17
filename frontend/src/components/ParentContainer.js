import React from "react";
import DroppableSpace from "./DroppableSpace";

const ParentContainer = ({
  spaces,
  items,
  onDrop,
  onDeleteItem,
  onDeleteSpace,
  onEditItem,
  onEditSpace,
  handleSpaceClick,
}) => {
  return (
    <div style={{ flex: 1, border: "1px solid #ccc", padding: "20px", overflowY: "auto" }}>
      <h2>Spaces</h2>
      {spaces.map((space) => (
        <div key={space.id} className="space-card" onClick={() => handleSpaceClick(space.id)}>
          <h3 style={{ margin: 0 }}>{space.name}</h3>
          <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
            <i
              className="fas fa-edit"
              style={{ cursor: "pointer", color: "blue" }}
              onClick={(e) => {
                e.stopPropagation();
                onEditSpace(space.id, space.name);
              }}
            ></i>
            <i
              className="fas fa-trash"
              style={{ cursor: "pointer", color: "red" }}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSpace(space.id);
              }}
            ></i>
          </div>
          <DroppableSpace space={space} onDrop={onDrop} />
        </div>
      ))}

      <h2>Items</h2>
      {items.map((item) => (
        <div key={item.id} className="item-card" style={{ marginTop: "10px" }}>
          <strong>{item.name}</strong>
          <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
            <i
              className="fas fa-edit"
              style={{ cursor: "pointer", color: "blue" }}
              onClick={() => onEditItem(item.id, item.name, item.description)}
            ></i>
            <i
              className="fas fa-trash"
              style={{ cursor: "pointer", color: "red" }}
              onClick={() => onDeleteItem(item.id)}
            ></i>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ParentContainer;

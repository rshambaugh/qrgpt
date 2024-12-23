import React from "react";
import DroppableSpace from "./DroppableSpace";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";

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
        <div
          key={space.id}
          className="space-card"
          style={{
            position: "relative",
            backgroundColor: "#e3f2fd",
            padding: "15px",
            marginBottom: "10px",
            borderRadius: "8px",
          }}
          onClick={() => handleSpaceClick(space.id)}
        >
          <h3 style={{ margin: 0 }}>{space.name || "Unnamed Space"}</h3>
          <div
            style={{
              position: "absolute",
              top: "5px",
              right: "5px",
              display: "flex",
              gap: "8px",
            }}
          >
            <FontAwesomeIcon
              icon={faEdit}
              style={{ cursor: "pointer", color: "blue" }}
              onClick={(e) => {
                e.stopPropagation();
                if (space.id) {
                  onEditSpace(space.id, space.name || "Unnamed Space");
                } else {
                  console.error("Error: Space ID is undefined", space);
                }
              }}
            />

            <FontAwesomeIcon
              icon={faTrash}
              style={{ cursor: "pointer", color: "red" }}
              onClick={(e) => {
                e.stopPropagation();
                if (space.id) {
                  onDeleteSpace(space.id);
                } else {
                  console.error("Error: Space ID is undefined", space);
                }
              }}
            />
          </div>
          <DroppableSpace space={space} onDrop={onDrop} />
        </div>
      ))}

      <h2>Items</h2>
      {items.map((item) => (
        <div
          key={item.id}
          className="item-card"
          style={{
            position: "relative",
            backgroundColor: "#ff9800",
            padding: "15px",
            marginBottom: "10px",
            borderRadius: "8px",
          }}
        >
          <strong>{item.name || "Unnamed Item"}</strong>
          <div
            style={{
              position: "absolute",
              top: "5px",
              right: "5px",
              display: "flex",
              gap: "8px",
            }}
          >
            <FontAwesomeIcon
              icon={faEdit}
              style={{ cursor: "pointer", color: "blue" }}
              onClick={() => {
                if (item.id) {
                  onEditItem(item.id, item.name || "Unnamed Item", item.description || "");
                } else {
                  console.error("Error: Item ID is undefined", item);
                }
              }}
            />

            <FontAwesomeIcon
              icon={faTrash}
              style={{ cursor: "pointer", color: "red" }}
              onClick={() => {
                if (item.id) {
                  onDeleteItem(item.id);
                } else {
                  console.error("Error: Item ID is undefined", item);
                }
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ParentContainer;

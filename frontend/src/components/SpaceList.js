import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";

function SpaceList({ spaces, items, onDrop, onSpaceClick, currentSpaceId }) {
  const renderSpaces = (parentId) =>
    spaces
      .filter((space) => space.parent_id === parentId)
      .map((space) => (
        <div
          key={space.id}
          style={{
            margin: "10px 0",
            padding: "10px",
            backgroundColor: "#e0f7ff",
            borderRadius: "4px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          onClick={() => onSpaceClick(space.id)}
        >
          <div>
            <strong>{space.name}</strong>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <FontAwesomeIcon
              icon={faEdit}
              style={{ cursor: "pointer", color: "blue" }}
              onClick={(e) => {
                e.stopPropagation();
                onSpaceClick(space.id);
              }}
            />
            <FontAwesomeIcon
              icon={faTrash}
              style={{ cursor: "pointer", color: "red" }}
              onClick={(e) => {
                e.stopPropagation();
                onDrop(space.id, null, "SPACE");
              }}
            />
          </div>
        </div>
      ));

  if (currentSpaceId) {
    // detail mode: show just current space and its children
    const currentSpace = spaces.find((s) => s.id === currentSpaceId);
    if (!currentSpace) return <div>Space not found</div>;

    return (
      <div>
        <div
          style={{
            margin: "10px 0",
            padding: "10px",
            backgroundColor: "#e0f7ff",
            borderRadius: "4px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <strong>{currentSpace.name}</strong>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <FontAwesomeIcon
              icon={faEdit}
              style={{ cursor: "pointer", color: "blue" }}
              onClick={() => onSpaceClick(currentSpace.id)}
            />
            <FontAwesomeIcon
              icon={faTrash}
              style={{ cursor: "pointer", color: "red" }}
              onClick={() => onDrop(currentSpace.id, null, "SPACE")}
            />
          </div>
        </div>
        <div style={{ paddingLeft: "20px" }}>{renderSpaces(currentSpaceId)}</div>
      </div>
    );
  } else {
    // list mode: show top-level spaces
    return <div>{renderSpaces(null)}</div>;
  }
}

export default SpaceList;

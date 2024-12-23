import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useDrag, useDrop } from "react-dnd";

function Space({ space, items, onDrop, onSpaceClick, onDeleteSpace, onEditSpace, children }) {
  const [{ isDragging }, drag] = useDrag({
    type: "SPACE",
    item: { id: space.id, type: "SPACE" },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ["ITEM", "SPACE"],
    drop: (draggedItem, monitor) => {
      if (!monitor.didDrop()) {
        const dropType = draggedItem.type === "ITEM" ? "item" : "space";
        onDrop(draggedItem.id, space.id, dropType);
      }
    },
    canDrop: (draggedItem) => draggedItem.type !== "SPACE" || draggedItem.id !== space.id,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const [editingSpace, setEditingSpace] = useState(false);
  const [editedSpaceName, setEditedSpaceName] = useState(space.name);

  const handleSpaceEditSubmit = useCallback(
    (e) => {
      e.preventDefault();
      onEditSpace(space.id, editedSpaceName);
      setEditingSpace(false);
    },
    [onEditSpace, space.id, editedSpaceName]
  );

  const [hoverTimer, setHoverTimer] = useState(null);
  const [draggingOver, setDraggingOver] = useState(false);

  useEffect(() => {
    if (draggingOver && !hoverTimer) {
      const timer = setTimeout(() => {
        onSpaceClick(space.id);
      }, 1000);
      setHoverTimer(timer);
    } else if (!draggingOver && hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }

    return () => {
      if (hoverTimer) clearTimeout(hoverTimer);
    };
  }, [draggingOver, hoverTimer, onSpaceClick, space.id]);

  const spaceStyle = useMemo(
    () => ({
      border: isOver ? "2px dashed green" : "1px solid gray",
      backgroundColor: isOver && canDrop ? "#e0ffe0" : "white",
      opacity: isDragging ? 0.5 : 1,
      padding: "10px",
      borderRadius: "8px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      marginBottom: "10px",
      position: "relative",
    }),
    [isOver, canDrop, isDragging]
  );

  const handleDragEnter = useCallback(() => setDraggingOver(true), []);
  const handleDragLeave = useCallback(() => setDraggingOver(false), []);

  return (
    <div
      ref={(node) => drag(drop(node))}
      style={spaceStyle}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onMouseLeave={handleDragLeave}
    >
      {editingSpace ? (
        <form onSubmit={handleSpaceEditSubmit} style={{ marginBottom: "10px" }}>
          <input
            type="text"
            value={editedSpaceName}
            onChange={(e) => setEditedSpaceName(e.target.value)}
            style={{ width: "100%", marginBottom: "5px" }}
          />
          <button type="submit">Save</button>
          <button type="button" onClick={() => setEditingSpace(false)}>
            Cancel
          </button>
        </form>
      ) : (
        <h4
          onClick={() => onSpaceClick && onSpaceClick(space.id)}
          style={{ cursor: "pointer", margin: 0 }}
        >
          {space.name}
        </h4>
      )}

      {!editingSpace && (
        <div style={{ position: "absolute", top: "5px", right: "5px", display: "flex", gap: "5px" }}>
          <i
            className="fas fa-edit"
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              setEditingSpace(true);
            }}
          ></i>
          <i
            className="fas fa-trash"
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteSpace(space.id);
            }}
          ></i>
        </div>
      )}

      <div style={{ marginTop: "10px" }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              margin: "5px 0",
              padding: "5px",
              backgroundColor: "#ffc",
              borderRadius: "4px",
              cursor: "move",
              position: "relative",
            }}
          >
            {item.name}
          </div>
        ))}
      </div>

      {children && <div style={{ marginTop: "15px", paddingLeft: "20px" }}>{children}</div>}
    </div>
  );
}

export default Space;

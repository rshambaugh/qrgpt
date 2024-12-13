import React, { useState, useRef, useEffect } from "react";
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
        if (draggedItem.type === "ITEM") {
          onDrop(draggedItem.id, space.id, "item");
        } else if (draggedItem.type === "SPACE") {
          onDrop(draggedItem.id, space.id, "space");
        }
      }
    },
    canDrop: (draggedItem) => {
      if (draggedItem.type === "SPACE" && draggedItem.id === space.id) {
        return false;
      }
      return true;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Inline editing state for spaces
  const [editingSpace, setEditingSpace] = useState(false);
  const [editedSpaceName, setEditedSpaceName] = useState(space.name);

  const handleSpaceEditSubmit = (e) => {
    e.preventDefault();
    onEditSpace(space.id, editedSpaceName);
    setEditingSpace(false);
  };

  const [hoverTimer, setHoverTimer] = useState(null);
  const [draggingOver, setDraggingOver] = useState(false);

  // Hover logic: If we are dragging something over this space for >1s, open it
  useEffect(() => {
    if (draggingOver && !hoverTimer) {
      const timer = setTimeout(() => {
        onSpaceClick(space.id);
      }, 1000); // 1 second hover to open
      setHoverTimer(timer);
    } else if (!draggingOver && hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }

    return () => {
      if (hoverTimer) clearTimeout(hoverTimer);
    };
  }, [draggingOver, hoverTimer, onSpaceClick, space.id]);

  return (
    <div
      ref={(node) => drag(drop(node))}
      style={{
        border: isOver ? "2px dashed green" : "1px solid gray",
        backgroundColor: isOver && canDrop ? "#e0ffe0" : "white",
        opacity: isDragging ? 0.5 : 1,
        padding: "10px",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        marginBottom: "10px",
        position: "relative"
      }}
      onDragEnter={() => setDraggingOver(true)}
      onDragLeave={() => setDraggingOver(false)}
      onMouseLeave={() => setDraggingOver(false)}
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

      {/* Icons for edit/delete */}
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
              position: "relative"
            }}
          >
            {item.name}
            {/* No icons here because items might be handled in ItemList, but you could add them if desired */}
          </div>
        ))}
      </div>

      {children && <div style={{ marginTop: "15px", paddingLeft: "20px" }}>{children}</div>}
    </div>
  );
}

export default Space;

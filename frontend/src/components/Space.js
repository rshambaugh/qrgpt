import React from "react";
import { useDrop } from "react-dnd";

const Space = ({ space, items, children, onDrop }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ["ITEM", "SPACE"],
    drop: (draggedItem) => onDrop(draggedItem.id, space.id, draggedItem.type),
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  }));

  return (
    <div ref={drop} className={`space ${isOver ? "space-hover" : ""}`}>
      <div className="space-title">
        <span>{space.name}</span>
        <button
          className="delete-button"
          onClick={() => onDrop(space.id, null, "delete-space")}
        >
          Delete
        </button>
      </div>
      <div className="space-children">{children}</div>
      <div className="space-items">
        {items.map((item) => (
          <div key={item.id} className="item">
            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Space;

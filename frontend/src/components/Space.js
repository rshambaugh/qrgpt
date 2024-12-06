import React from "react";
import { useDrop } from "react-dnd";

const Space = ({ space, items, children, onDrop }) => {
    const [{ isOver }, drop] = useDrop({
        accept: ["ITEM"],
        drop: (draggedItem) => {
            console.log("Dropped item:", draggedItem);
            onDrop(draggedItem.id, space.id); // Pass item ID and target space ID
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    });
        

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

// Export must be outside any other block or code
export default Space;

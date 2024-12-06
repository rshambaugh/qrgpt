import React from "react";
import { useDrag } from "react-dnd";

const Item = ({ item, onDelete }) => {
    const [{ isDragging }, drag] = useDrag({
        type: "ITEM", // Matches the "accept" type in Space.js
        item: { id: item.id, type: "ITEM" },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    return (
        <div
            ref={drag}
            className="item"
            style={{
                opacity: isDragging ? 0.5 : 1, // Visual cue for dragging
                cursor: "move", // Cursor indicates draggable
            }}
        >
            <span>{item.name}</span>
            <button
                className="delete-button"
                onClick={() => onDelete(item.id)}
                style={{
                    marginLeft: "10px", // Adjust spacing for better visuals
                    padding: "2px 5px", // Reduce button size
                    fontSize: "0.8em", // Smaller text
                }}
            >
                X
            </button>
        </div>
    );
};

export default Item;

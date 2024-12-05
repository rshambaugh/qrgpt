import React from 'react';
import { useDrag } from 'react-dnd';

const DraggableItem = ({ item, onDelete }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'item',
        item: { id: item.id },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    return (
        <div
            ref={drag}
            className="list-item"
            style={{
                backgroundColor: isDragging ? '#f8d7da' : '#ff9800', // Highlight when dragging
            }}
        >
            <span>{item.name}</span>
            <button
                className="delete"
                onClick={() => onDelete(item.id)} // Call onDelete with item ID
            >
                Delete
            </button>
        </div>
    );
};

export default DraggableItem;

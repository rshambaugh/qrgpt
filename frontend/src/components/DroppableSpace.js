import React from 'react';
import { useDrop } from 'react-dnd';

const DroppableSpace = ({ space, items, onDrop, onDelete }) => {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: 'item',
        drop: (draggedItem) => onDrop(draggedItem.id, space.id),
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }));

    return (
        <div
            ref={drop}
            className="list-item"
            style={{ backgroundColor: isOver ? '#d4edda' : '#fff' }}
        >
            <span>{space.name}</span>
            <button className="delete" onClick={() => onDelete(space.id)}>
                Delete
            </button>
        </div>
    );
};

export default DroppableSpace;

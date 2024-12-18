import React from 'react';
import { useDrop } from 'react-dnd';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

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
            <FontAwesomeIcon
                icon={faTrash}
                className="delete-icon"
                style={{ cursor: "pointer", color: "red" }}
                onClick={() => onDelete(space.id)}
            />
        </div>
    );
};

export default DroppableSpace;

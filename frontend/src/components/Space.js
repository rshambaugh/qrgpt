import React from 'react';
import { useDrop } from 'react-dnd';

const Space = ({ space, items, onDrop, onDelete }) => {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: 'ITEM',
        drop: (item) => onDrop(item.id, space.id),
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    }));

    const spaceItems = items.filter((item) => item.storage_space_id === space.id);

    return (
        <div ref={drop} className={`space ${isOver ? 'space-hover' : ''}`}>
            <h3 className="space-title">
                {space.name}
                <button className="delete-button" onClick={() => onDelete(space.id)}>
                    Delete
                </button>
            </h3>
            {spaceItems.map((item) => (
                <div key={item.id} className="space-item">
                    {item.name}
                </div>
            ))}
        </div>
    );
};

export default Space;

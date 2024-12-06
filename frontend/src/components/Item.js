import React from 'react';
import { useDrag } from 'react-dnd';

const Item = ({ item, onDelete }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'ITEM',
        item: { id: item.id },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));

    return (
        <div
            ref={drag}
            className="item"
            style={{ opacity: isDragging ? 0.5 : 1 }}
        >
            {item.name}
            <button className="delete-button" onClick={() => onDelete(item.id)}>
                Delete
            </button>
        </div>
    );
};

export default Item;

import React from 'react';
import { useDrop } from 'react-dnd';

const Space = ({ space, items, onDrop }) => {
    const [, drop] = useDrop(() => ({
        accept: 'item',
        drop: (droppedItem) => onDrop(droppedItem.id, space.id),
    }));

    return (
        <div
            ref={drop}
            style={{
                padding: '10px',
                margin: '10px',
                backgroundColor: '#90CAF9',
                minHeight: '100px',
                border: '1px solid #2196F3',
            }}
        >
            <h4>{space.name}</h4>
            {items.map((item) => (
                <div key={item.id}>{item.name}</div>
            ))}
        </div>
    );
};

export default Space;

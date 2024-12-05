import React from 'react';
import { useDrop } from 'react-dnd';

const Space = ({ space, items, onDrop }) => {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: 'ITEM',
        drop: (item) => onDrop(item.id, space.id),
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    }));

    const spaceItems = items.filter((item) => item.storage_space_id === space.id);

    return (
        <div
            ref={drop}
            style={{
                backgroundColor: isOver ? '#76c893' : '#e0f7fa',
                padding: '10px',
                margin: '10px',
                border: '2px dashed #00796b',
                borderRadius: '5px',
            }}
        >
            <h3>{space.name}</h3>
            {spaceItems.map((item) => (
                <div
                    key={item.id}
                    style={{
                        padding: '5px',
                        margin: '5px',
                        backgroundColor: '#fff59d',
                        border: '1px solid #000',
                        borderRadius: '3px',
                    }}
                >
                    {item.name}
                </div>
            ))}
        </div>
    );
};

export default Space;

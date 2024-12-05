import React from 'react';
import { useDrag } from 'react-dnd';

const DraggableItem = ({ item }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'item',
        item: { id: item.id },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));

    return (
        <div
            ref={drag}
            style={{
                opacity: isDragging ? 0.5 : 1,
                padding: '10px',
                margin: '5px',
                backgroundColor: '#FFA726',
                cursor: 'move',
            }}
        >
            {item.name}
        </div>
    );
};

export default DraggableItem;

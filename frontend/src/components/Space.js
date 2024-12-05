import React from 'react';
import { useDrop } from 'react-dnd';

const Space = ({ space, items = [], onDrop }) => { // Default `items` to an empty array
    // Configure the useDrop hook
    const [{ isOver }, drop] = useDrop(() => ({
        accept: 'ITEM', // Accepts items of type 'ITEM'
        drop: (item) => onDrop(item.id, space.id), // Handles the drop action
        collect: (monitor) => ({
            isOver: monitor.isOver(), // Tracks hover state
        }),
    }));

    // Filter items belonging to this space
    const spaceItems = items.filter((item) => item.storage_space_id === space.id);

    // Dynamic styling for the space container
    const containerStyle = {
        backgroundColor: isOver ? '#d9f2d9' : '#e3f2fd', // Hover effect
        padding: '15px',
        margin: '10px',
        border: isOver ? '2px solid #66bb6a' : '2px dashed #90caf9', // Solid border on hover
        borderRadius: '6px',
        boxShadow: isOver ? '0 4px 8px rgba(0, 0, 0, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.1)', // Subtle shadow
        transition: 'all 0.3s ease', // Smooth transition
    };

    const itemStyle = {
        padding: '10px',
        margin: '5px 0',
        backgroundColor: '#fff59d', // Light yellow for items
        border: '1px solid #000',
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', // Subtle shadow
    };

    return (
        <div ref={drop} style={containerStyle}>
            <h3 style={{ marginBottom: '10px', color: '#1e88e5' }}>{space.name}</h3>
            <div>
                {spaceItems.map((item) => (
                    <div key={item.id} style={itemStyle}>
                        {item.name}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Space;

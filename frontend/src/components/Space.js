import React, { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';

const Space = ({ space, items, children, onDrop }) => {
  const [collapsed, setCollapsed] = useState(false); // State to manage collapsing

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  // Drag functionality for spaces
  const [{ isDragging }, drag] = useDrag({
    type: 'SPACE', // Matches the "accept" in useDrop
    item: { id: space.id, type: 'SPACE' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

// Drop functionality for spaces and items
const [{ isOver, canDrop }, drop] = useDrop({
  accept: ['ITEM', 'SPACE'], // Accept both items and spaces

  drop: (draggedItem) => {
    console.log('Drop detected:', draggedItem, 'Target space:', space.id);

    // Handle item drop
    if (draggedItem.type === 'ITEM') {
      onDrop(draggedItem.id, space.id, 'item');
    }

    // Handle space drop (ensure no self-referencing)
    else if (draggedItem.type === 'SPACE') {
      if (draggedItem.id !== space.id) {
        onDrop(draggedItem.id, space.id, 'space');
      } else {
        console.warn('Cannot drop a space onto itself.');
      }
    }
  },

  canDrop: (draggedItem) => {
    // Prevent dropping a space onto itself
    if (draggedItem.type === 'SPACE' && draggedItem.id === space.id) {
      return false;
    }
    return true; // Allow other drops
  },

  collect: (monitor) => ({
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop(),
  }),
});

// Additional styling for debugging
const dropStyle = {
  border: isOver
    ? canDrop
      ? '2px dashed green' // Valid drop target
      : '2px dashed red' // Invalid drop target
    : '1px solid transparent',
};


  return (
    <div
      ref={drag(drop())} // Combine drag and drop refs
      className={`space ${isOver && canDrop ? 'space-hover' : ''}`}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        marginBottom: '10px',
        border: isOver && canDrop ? '2px dashed #007bff' : '1px solid #ddd', // Highlight when valid
        padding: '10px',
        backgroundColor: '#f9f9f9',
      }}
    >
      <div className="space-header">
        {/* Toggle Collapse Button */}
        <span
          style={{
            cursor: 'pointer',
            fontWeight: 'bold',
            marginRight: '5px',
            color: '#007bff',
          }}
          onClick={toggleCollapse}
        >
          {collapsed ? '+ ' : '- '}
        </span>
        <span style={{ fontWeight: 'bold' }}>{space.name}</span>
        <button
          className="delete-button"
          style={{
            marginLeft: 'auto',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            cursor: 'pointer',
            borderRadius: '3px',
          }}
          onClick={() => onDrop(space.id, null, 'delete-space')}
        >
          Delete
        </button>
      </div>

      {/* Render children and items if not collapsed */}
      {!collapsed && (
        <>
          <div className="space-children" style={{ marginTop: '10px' }}>
            {children}
          </div>
          <div className="space-items" style={{ marginTop: '10px' }}>
            {items.map((item) => (
              <div
                key={item.id}
                className="item"
                style={{
                  padding: '8px',
                  backgroundColor: '#ffc107',
                  marginBottom: '5px',
                  borderRadius: '5px',
                  cursor: 'move',
                }}
              >
                {item.name}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Space;

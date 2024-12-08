import React, { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';

const Space = ({ space, items, children, onDrop }) => {
  const [collapsed, setCollapsed] = useState(false); // State to manage collapsing

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  // Drag functionality for spaces
  const [{ isDragging }, drag] = useDrag({
    type: 'SPACE',
    item: { id: space.id, type: 'SPACE' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Drop functionality for spaces and items
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['ITEM', 'SPACE'],
    drop: (draggedItem) => {
      if (draggedItem.type === 'ITEM') {
        onDrop(draggedItem.id, space.id, 'item');
      } else if (draggedItem.type === 'SPACE' && draggedItem.id !== space.id) {
        onDrop(draggedItem.id, space.id, 'space');
      }
    },
    canDrop: (draggedItem) => draggedItem.type !== 'SPACE' || draggedItem.id !== space.id,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={drag(drop())} // Combine drag and drop refs
      className={`space ${isOver && canDrop ? 'space-hover' : ''}`}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        border: isOver && canDrop ? '2px dashed #007bff' : '1px solid #ddd',
        padding: '10px',
        backgroundColor: '#f9f9f9',
        marginBottom: '10px',
      }}
    >
      <div className="space-header">
        <span
          onClick={toggleCollapse}
          style={{
            cursor: 'pointer',
            fontWeight: 'bold',
            marginRight: '5px',
            color: '#007bff',
          }}
        >
          {collapsed ? '+ ' : '- '}
        </span>
        <span style={{ fontWeight: 'bold' }}>{space.name}</span>
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

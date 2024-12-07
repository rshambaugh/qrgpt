// frontend/src/components/Space.js

import React from 'react';
import { useDrag, useDrop } from 'react-dnd';

const Space = ({ space, items, children, onDrop }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'SPACE',
    item: { id: space.id, type: 'SPACE' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: ['ITEM', 'SPACE'],
    drop: (draggedItem) => {
      if (draggedItem.type === 'ITEM') {
        onDrop(draggedItem.id, space.id, 'item');
      } else if (draggedItem.type === 'SPACE') {
        if (draggedItem.id !== space.id) {
          onDrop(draggedItem.id, space.id, 'space');
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drag(drop())}
      className={`space ${isOver ? 'space-hover' : ''}`}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
      }}
    >
      <div className="space-title">
        <span>{space.name}</span>
        <button
          className="delete-button"
          onClick={() => onDrop(space.id, null, 'delete-space')}
        >
          Delete
        </button>
      </div>
      <div className="space-children">{children}</div>
      <div className="space-items">
        {items.map((item) => (
          <div key={item.id} className="item">
            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Space;

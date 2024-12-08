import React from 'react';
import { useDrag } from 'react-dnd';

const Item = ({ item }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'ITEM',
    item: { id: item.id, type: 'ITEM' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className="item"
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        padding: '8px',
        backgroundColor: '#ffc107',
        marginBottom: '5px',
        borderRadius: '5px',
      }}
    >
      {item.name}
    </div>
  );
};

export default Item;

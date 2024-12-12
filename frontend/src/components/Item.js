import React from 'react';
import { useDrag } from 'react-dnd';

const Item = ({ item }) => {
  const [{ isDragging }, dragRef] = useDrag({
    type: "ITEM",
    item: { id: item.id, type: "ITEM" },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={dragRef}
      style={{
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: '#ffc',
        margin: '5px',
        padding: '5px',
        cursor: 'move',
        borderRadius: '4px',
      }}
    >
      {item.name}
    </div>
  );
};

export default Item;

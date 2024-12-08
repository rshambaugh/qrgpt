import React from 'react';
import { useDrag } from 'react-dnd';

const Item = ({ item, onDrop }) => {
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
        padding: '5px',
        backgroundColor: 'yellow',
        margin: '5px',
      }}
    >
      {item.name}
    </div>
  );
};

const ItemList = ({ items, onDrop }) => {
  return (
    <div className="item-list">
      {items.map((item) => (
        <Item key={item.id} item={item} onDrop={onDrop} />
      ))}
    </div>
  );
};

export default ItemList;

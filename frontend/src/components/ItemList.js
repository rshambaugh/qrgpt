import React from 'react';
import { useDrop } from 'react-dnd';
import Item from './Item';

const ItemList = ({ items, onDrop }) => {
  const [{ isOver }, dropRef] = useDrop({
    accept: "ITEM",
    drop: (draggedItem) => {
      // onDrop logic for items (e.g., move item to unassigned or a space)
      // If onDrop requires a spaceId, pass null or handle as needed
      if (draggedItem.type === 'ITEM') {
        onDrop(draggedItem.id, null, 'item'); 
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={dropRef}
      style={{
        border: isOver ? '2px dashed green' : '1px solid gray',
        padding: '10px',
        backgroundColor: '#f9f9f9',
      }}
    >
      <h3>Unassigned Items</h3>
      {items.map(item => (
        <Item key={item.id} item={item} />
      ))}
    </div>
  );
};

export default ItemList;

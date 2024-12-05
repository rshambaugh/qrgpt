import React from 'react';
import DraggableItem from './DraggableItem';

const ItemList = ({ items, onDelete }) => {
    return (
        <div>
            {items.map((item) => (
                <DraggableItem
                    key={item.id}
                    item={item}
                    onDelete={onDelete} // Pass onDelete handler
                />
            ))}
        </div>
    );
};

export default ItemList;

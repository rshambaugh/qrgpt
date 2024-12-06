import React from 'react';
import Item from './Item';

const ItemList = ({ items, onDelete }) => {
    return (
        <div className="item-list">
            {items.map((item) => (
                <Item key={item.id} item={item} onDelete={onDelete} />
            ))}
        </div>
    );
};

export default ItemList;

import React from 'react';
import DraggableItem from './DraggableItem';

const ItemList = ({ items }) => {
    return (
        <div className="item-list">
            {items.map((item) => (
                <div key={item.id} className="item-box">
                    {item.name || "Unnamed Item"} - {item.description || "No Description"}
                </div>
            ))}
        </div>
    );
};


export default ItemList;

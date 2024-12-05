import React from 'react';

const ItemList = ({ items, onDelete }) => {
    return (
        <div className="item-list">
            {items.map((item) => (
                <div className="item" key={item.id}>
                    <span>{item.name}</span>
                    <button
                        className="delete-button"
                        onClick={() => onDelete(item.id)}
                    >
                        Delete
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ItemList;

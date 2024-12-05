import React from 'react';
import DroppableSpace from './DroppableSpace';

const SpaceList = ({ spaces, items, onDrop, onDelete }) => (
    <div className="list-container">
        {spaces.map((space) => (
            <DroppableSpace
                key={space.id}
                space={space}
                items={items}
                onDrop={onDrop}
                onDelete={onDelete}
            />
        ))}
    </div>
);

export default SpaceList;

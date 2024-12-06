import React from 'react';
import Space from './Space';

const SpaceList = ({ spaces, items, onDrop, onDelete }) => {
    return (
        <div className="space-list">
            {spaces.map((space) => (
                <Space
                    key={space.id}
                    space={space}
                    items={items}
                    onDrop={onDrop}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
};

export default SpaceList;

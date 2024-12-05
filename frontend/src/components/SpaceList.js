import React from 'react';
import Space from './Space'; // Ensure Space is correctly imported

const SpaceList = ({ spaces, items, onDrop }) => {
    return (
        <div>
            {spaces.map((space) => (
                <Space
                    key={space.id}
                    space={space}
                    items={items}
                    onDrop={onDrop}
                />
            ))}
        </div>
    );
};

export default SpaceList;

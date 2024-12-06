import React from 'react';
import Space from './Space';

const SpaceList = ({ spaces, items, onDropItem, onDropSpace, onDelete }) => {
    return (
        <div>
            {spaces.map((space) => (
                <Space
                    key={space.id}
                    space={space}
                    items={items.filter((item) => item.space_id === space.id)}
                    spaces={spaces.filter((childSpace) => childSpace.parent_id === space.id)}
                    onDropItem={onDropItem}
                    onDropSpace={onDropSpace}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
};

export default SpaceList;

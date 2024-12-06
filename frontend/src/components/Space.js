import React from 'react';
import { useDrop } from 'react-dnd';

const Space = ({ space, items, spaces, onDropItem, onDropSpace, onDelete }) => {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: ['ITEM', 'SPACE'],
        drop: (draggedItem) => {
            if (draggedItem.type === 'ITEM') {
                onDropItem(draggedItem.id, space.id);
            } else if (draggedItem.type === 'SPACE') {
                onDropSpace(draggedItem.id, space.id);
            }
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    }));

    return (
        <div
            ref={drop}
            className={isOver ? 'space hover' : 'space'}
        >
            <div className="space-title">
                <h3>{space.name}</h3>
                <button className="delete-button" onClick={() => onDelete(space.id)}>
                    Delete
                </button>
            </div>
            <div className="nested-items">
                {items.map((item) => (
                    <div key={item.id} className="item">
                        {item.name}
                    </div>
                ))}
            </div>
            <div className="nested-spaces">
                {spaces.map((childSpace) => (
                    <Space
                        key={childSpace.id}
                        space={childSpace}
                        items={items.filter((item) => item.space_id === childSpace.id)}
                        spaces={spaces.filter((nestedSpace) => nestedSpace.parent_id === childSpace.id)}
                        onDropItem={onDropItem}
                        onDropSpace={onDropSpace}
                        onDelete={onDelete}
                    />
                ))}
            </div>
        </div>
    );
};

export default Space;

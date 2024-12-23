import React from 'react';
import { useDrag } from 'react-dnd';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faEdit } from "@fortawesome/free-solid-svg-icons";

const DraggableItem = ({ item, onDelete, onEdit }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'item',
        item: { id: item.id },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    return (
        <div
            ref={drag}
            className="list-item"
            style={{
                backgroundColor: isDragging ? '#f8d7da' : '#ff9800',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px',
                borderRadius: '4px',
                color: '#fff',
                position: 'relative',
            }}
        >
            <span>{item.name}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
                <FontAwesomeIcon
                    icon={faEdit}
                    className="edit-icon"
                    style={{ cursor: 'pointer', color: 'blue' }}
                    onClick={() => onEdit(item.id)}
                />
                <FontAwesomeIcon
                    icon={faTrash}
                    className="delete-icon"
                    style={{ cursor: 'pointer', color: 'red' }}
                    onClick={() => onDelete(item.id)}
                />
            </div>
        </div>
    );
};

export default DraggableItem;

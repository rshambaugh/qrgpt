import React from "react";
import { useDrop } from "react-dnd";

const ItemType = {
    ITEM: "item",
};

const Space = ({ space, items, onDrop }) => {
    const [, drop] = useDrop(() => ({
        accept: ItemType.ITEM,
        drop: (droppedItem) => onDrop(droppedItem.id, space.id),
    }));

    return (
        <div
            ref={drop}
            className="space-box"
            style={{
                border: "2px dashed #219ebc", // Bright blue for visibility
                padding: "10px",
                margin: "10px 0",
                borderRadius: "5px",
                backgroundColor: "#8ecae6", // Light blue for the container
                color: "#023047", // Dark text for contrast
            }}
        >
            <h3>{space.name || "Unnamed Space"}</h3>
            <div>
                {items
                    .filter((item) => item.storage_space_id === space.id)
                    .map((item) => (
                        <div
                            key={item.id}
                            style={{
                                backgroundColor: "#ffb703", // Bright orange for items
                                padding: "5px",
                                margin: "5px 0",
                                borderRadius: "3px",
                                color: "#000",
                            }}
                        >
                            {item.name || "Unnamed Item"}
                        </div>
                    ))}
            </div>
        </div>
    );
};

const SpaceList = ({ spaces, items, onDrop }) => {
    return (
        <div className="space-list">
            {spaces.map((space) => (
                <Space key={space.id} space={space} items={items} onDrop={onDrop} />
            ))}
        </div>
    );
};

export default SpaceList;

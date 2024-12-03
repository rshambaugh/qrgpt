
import React, { useEffect, useState } from "react";
import "./App.css"; // Add appropriate styles for drag-and-drop
import { DndProvider } from "react-dnd";
import { useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import axios from "axios";
import "./styles.css";

const ItemType = {
    ITEM: "item",
};

const DraggableItem = ({ item }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemType.ITEM,
        item: { id: item.id },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));

    return (
        <div
            ref={drag}
            className={`draggable-item ${isDragging ? "dragging" : ""}`}
        >
            {item.name}
        </div>
    );
};

const DroppableContainer = ({ container, items, onDrop }) => {
    const [, drop] = useDrop(() => ({
        accept: ItemType.ITEM,
        drop: (droppedItem) => onDrop(droppedItem.id, container.id),
    }));

    return (
        <div ref={drop} className="droppable-container">
            <h3>{container.name}</h3>
            {items.map((item) => (
                <div key={item.id} className="contained-item">
                    {item.name}
                </div>
            ))}
        </div>
    );
};

const App = () => {
    const [items, setItems] = useState([]);
    const [containers, setContainers] = useState([]);

    useEffect(() => {
        // Fetch items and containers from the backend
        const fetchData = async () => {
            try {
                const itemsResponse = await axios.get(
                    "http://localhost:8000/items/"
                );
                const containersResponse = await axios.get(
                    "http://localhost:8000/containers/"
                );
                setItems(itemsResponse.data.items);
                setContainers(containersResponse.data.containers);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    const handleDrop = async (itemId, containerId) => {
        try {
            await axios.put(`http://localhost:8000/items/${itemId}/container`, {
                storage_container_id: containerId,
            });

            setItems((prevItems) =>
                prevItems.map((item) =>
                    item.id === itemId
                        ? { ...item, storage_container_id: containerId }
                        : item
                )
            );
        } catch (error) {
            console.error("Failed to update item container:", error);
        }
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="app">
                <h1>Inventory Management</h1>
                <div className="inventory-grid">
                    <div className="items-section">
                        <h2>Unassigned Items</h2>
                        <div className="items-list">
                            {items
                                .filter((item) => !item.storage_container_id)
                                .map((item) => (
                                    <DraggableItem key={item.id} item={item} />
                                ))}
                        </div>
                    </div>
                    <div className="containers-section">
                        <h2>Containers</h2>
                        <div className="containers-list">
                            {containers.map((container) => (
                                <DroppableContainer
                                    key={container.id}
                                    container={container}
                                    items={items.filter(
                                        (item) =>
                                            item.storage_container_id ===
                                            container.id
                                    )}
                                    onDrop={handleDrop}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </DndProvider>
    );
};

export default App;

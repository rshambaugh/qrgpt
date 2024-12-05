import React, { useState, useEffect } from 'react';
import AddItemForm from './components/AddItemForm';
import AddSpaceForm from './components/AddSpaceForm';
import ItemList from './components/ItemList';
import SpaceList from './components/SpaceList';
import axios from 'axios';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const App = () => {
    const [items, setItems] = useState([]);
    const [spaces, setSpaces] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const itemsResponse = await axios.get('http://localhost:8000/items/');
                const spacesResponse = await axios.get('http://localhost:8000/spaces/');
                setItems(itemsResponse.data);
                setSpaces(spacesResponse.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    const addItem = async (newItem) => {
        try {
            const response = await axios.post('http://localhost:8000/items/', newItem);
            setItems((prev) => [...prev, response.data]);
        } catch (error) {
            console.error('Error adding item:', error);
        }
    };

    const addSpace = async (newSpace) => {
        try {
            const response = await axios.post('http://localhost:8000/spaces/', newSpace);
            setSpaces((prev) => [...prev, response.data]);
        } catch (error) {
            console.error('Error adding space:', error);
        }
    };

    const handleDrop = async (itemId, spaceId) => {
        try {
            await axios.put(`http://localhost:8000/items/${itemId}/space`, { space_id: spaceId });
            setItems((prevItems) =>
                prevItems.map((item) =>
                    item.id === itemId ? { ...item, storage_space_id: spaceId } : item
                )
            );
        } catch (error) {
            console.error('Error updating item:', error);
        }
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div>
                <h1>QRganizer</h1>
                <AddItemForm onAddItem={addItem} />
                <AddSpaceForm onAddSpace={addSpace} />
                <section>
                    <h2>Unassigned Items</h2>
                    <ItemList items={items.filter((item) => !item.storage_space_id)} />
                </section>
                <section>
                    <h2>Spaces</h2>
                    <SpaceList spaces={spaces} items={items} onDrop={handleDrop} />
                </section>
            </div>
        </DndProvider>
    );
};

export default App;

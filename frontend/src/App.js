import React, { useState, useEffect } from 'react';
import AddItemForm from './components/AddItemForm';
import AddSpaceForm from './components/AddSpaceForm';
import ItemList from './components/ItemList';
import SpaceList from './components/SpaceList';
import axios from 'axios';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './styles.css';

const App = () => {
    const [items, setItems] = useState([]);
    const [spaces, setSpaces] = useState([]);

    // Fetch items and spaces from the backend
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

    // Add item
    const addItem = async (newItem) => {
        try {
            const response = await axios.post('http://localhost:8000/items/', newItem);
            setItems((prevItems) => [...prevItems, response.data]);
        } catch (error) {
            console.error('Error adding item:', error);
        }
    };

    // Add space
    const addSpace = async (newSpace) => {
        try {
            const response = await axios.post('http://localhost:8000/spaces/', newSpace);
            setSpaces((prevSpaces) => [...prevSpaces, response.data]);
        } catch (error) {
            console.error('Error adding space:', error);
        }
    };

    // Delete item
    const handleDeleteItem = async (itemId) => {
        try {
            await axios.delete(`http://localhost:8000/items/${itemId}`);
            setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    // Delete space
    const handleDeleteSpace = async (spaceId) => {
        try {
            await axios.delete(`http://localhost:8000/spaces/${spaceId}`);
            setSpaces((prevSpaces) => prevSpaces.filter((space) => space.id !== spaceId));
        } catch (error) {
            console.error('Error deleting space:', error);
        }
    };

    // Handle drag-and-drop
    const handleDrop = async (itemId, spaceId) => {
        try {
            await axios.put(`http://localhost:8000/items/${itemId}/space`, { space_id: spaceId });
            setItems((prevItems) =>
                prevItems.map((item) =>
                    item.id === itemId ? { ...item, space_id: spaceId } : item
                )
            );
        } catch (error) {
            console.error('Error updating item:', error);
        }
    };
    

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="app-container">
                <h1 className="app-title">QRganizer</h1>
                <div className="form-container">
                    <AddItemForm onAddItem={addItem} />
                    <AddSpaceForm onAddSpace={addSpace} />
                </div>
                <div className="content-container">
                <section className="item-section">
                    <h2 className="section-title">Unassigned Items</h2>
                    <ul className="item-list">
                        <ItemList
                            items={items.filter((item) => !item.space_id)}
                            onDelete={handleDeleteItem}
                        />
                    </ul>
                </section>
                    <section className="space-section">
                        <h2 className="section-title">Spaces</h2>
                        <ul className="space-list">
                        <Space
                            key={space.id}
                            space={space}
                            items={items} // Make sure `items` is passed here
                            onDrop={onDrop}
                        />


                        </ul>
                    </section>
                </div>
            </div>
        </DndProvider>
    );
};

export default App;

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
            setItems((prevItems) => [...prevItems, response.data]);
        } catch (error) {
            console.error('Error adding item:', error);
        }
    };

    const addSpace = async (newSpace) => {
        try {
            const response = await axios.post('http://localhost:8000/spaces/', newSpace);
            setSpaces((prevSpaces) => [...prevSpaces, response.data]);
        } catch (error) {
            console.error('Error adding space:', error);
        }
    };

    const handleDeleteItem = async (itemId) => {
        try {
            await axios.delete(`http://localhost:8000/items/${itemId}`);
            setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    const handleDeleteSpace = async (spaceId) => {
        try {
            await axios.delete(`http://localhost:8000/spaces/${spaceId}`);
            setSpaces((prevSpaces) => prevSpaces.filter((space) => space.id !== spaceId));
        } catch (error) {
            console.error('Error deleting space:', error);
        }
    };

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

    const deleteItem = async (itemId) => {
        try {
            await axios.delete(`http://localhost:8000/items/${itemId}`);
            setItems((prevItems) => prevItems.filter((item) => item.id !== itemId)); // Remove from state
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };
    
    <ItemList items={items.filter((item) => !item.space_id)} onDelete={deleteItem} />
    

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
                        <h2>Unassigned Items</h2>
                        <ItemList
                            items={items.filter((item) => !item.space_id)}
                            onDelete={handleDeleteItem}
                        />
                    </section>
                    <section className="space-section">
                        <h2>Spaces</h2>
                        <SpaceList
                            spaces={spaces}
                            items={items}
                            onDrop={handleDrop}
                            onDelete={handleDeleteSpace}
                        />
                    </section>
                </div>
            </div>
        </DndProvider>
    );
};

export default App;

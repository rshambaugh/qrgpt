import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import axios from 'axios';
import SpaceList from './components/SpaceList';
import ItemList from './components/ItemList';

const App = () => {
    const [spaces, setSpaces] = useState([]);
    const [items, setItems] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const spacesResponse = await axios.get('http://localhost:8000/spaces/');
                const itemsResponse = await axios.get('http://localhost:8000/items/');
                setSpaces(spacesResponse.data);
                setItems(itemsResponse.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, []);

    const handleDropItem = async (itemId, spaceId) => {
        try {
            await axios.put(`http://localhost:8000/items/${itemId}/space`, { new_space_id: spaceId });
            setItems((prevItems) =>
                prevItems.map((item) => (item.id === itemId ? { ...item, space_id: spaceId } : item))
            );
        } catch (error) {
            console.error('Error updating item space:', error);
        }
    };

    const handleDropSpace = async (spaceId, parentId) => {
        try {
            await axios.put(`http://localhost:8000/spaces/${spaceId}/parent`, { new_parent_id: parentId });
            setSpaces((prevSpaces) =>
                prevSpaces.map((space) =>
                    space.id === spaceId ? { ...space, parent_id: parentId } : space
                )
            );
        } catch (error) {
            console.error('Error updating space parent:', error);
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

    const handleDeleteItem = async (itemId) => {
        try {
            await axios.delete(`http://localhost:8000/items/${itemId}`);
            setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="app-container">
                <h1 className="app-title">Nested Spaces and Items</h1>
                <div className="content-container">
                    <div className="section">
                        <h2 className="section-title">Spaces</h2>
                        <SpaceList
                            spaces={spaces}
                            items={items}
                            onDropItem={handleDropItem}
                            onDropSpace={handleDropSpace}
                            onDelete={handleDeleteSpace}
                        />
                    </div>
                    <div className="section">
                        <h2 className="section-title">Unassigned Items</h2>
                        <ItemList
                            items={items.filter((item) => !item.space_id)}
                            onDelete={handleDeleteItem}
                        />
                    </div>
                </div>
            </div>
        </DndProvider>
    );
};

export default App;

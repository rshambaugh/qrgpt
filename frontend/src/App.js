import React, { useState, useEffect } from 'react';
import api from './services/api';
import pluralize from 'pluralize'; 
import { capitalizeWords } from './services/utils';


function App() {
    const [newItem, setNewItem] = useState({
        name: '',
        category: '',
        description: '',
        quantity: 1,
        location: '',
        storage_container: '',
        tags: '',
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewItem({ ...newItem, [name]: value });
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        const formattedItem = {
            ...newItem,
            name: capitalizeWords(newItem.name),
            category: capitalizeWords(newItem.category),
            location: capitalizeWords(newItem.location),
            storage_container: capitalizeWords(newItem.storage_container),
            quantity: parseInt(newItem.quantity, 10),
            tags: newItem.tags.split(',').map((tag) => capitalizeWords(tag.trim())),
        };
        
    
        api.post('/items/', formattedItem)
            .then((response) => {
                console.log('Item created:', response.data);
                setItems([...items, response.data.item]); // Update the list with the new item
                setNewItem({
                    name: '',
                    category: '',
                    description: '',
                    quantity: 1,
                    location: '',
                    storage_container: '',
                    tags: '',
                });
            })
            .catch((error) => {
                console.error('Error creating item:', error);
            });
    };

    
    const handleUpdate = (id, updatedItem) => {
        console.log('Updating item:', { id, updatedItem });
        api.put(`/items/${id}`, updatedItem)
            .then((response) => {
                console.log('Item updated:', response.data);
                setItems(
                    items.map((item) =>
                        item.id === id ? { ...item, ...updatedItem } : item
                    )
                );
                setEditingItem(null); // Close the edit form
            })
            .catch((error) => {
                console.error('Error updating item:', error);
            });
    };
    

    const startVoiceCommand = () => {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
    
        recognition.start();
    
        recognition.onresult = (event) => {
            const command = event.results[0][0].transcript;
            console.log('Voice Command:', command);
            processVoiceCommand(command);
        };
    
        recognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
        };
    };
    
    const processVoiceCommand = (command) => {
        const addRegex = /add (\d+|one|two|three|four|five|six|seven|eight|nine|ten)?\s?(.*?) to (.*?) in(?: the)? (.*?)(?: with tags (.*))?$/i;
        const match = command.match(addRegex);
    
        if (match) {
            // Normalize quantity (convert words like "one" to numbers)
            let quantity = match[1] ? match[1].toLowerCase() : "1";
            const wordToNumber = {
                one: 1,
                two: 2,
                three: 3,
                four: 4,
                five: 5,
                six: 6,
                seven: 7,
                eight: 8,
                nine: 9,
                ten: 10,
            };
            quantity = isNaN(quantity) ? wordToNumber[quantity] || 1 : parseInt(quantity, 10);
    
            // Extract fields
            let name = match[2].trim().toLowerCase();
            let storageContainer = match[3].trim().toLowerCase();
            const location = match[4].trim().toLowerCase();
            const tags = match[5] ? match[5].split(' and ').map((tag) => tag.trim().toLowerCase()) : [];
    
            // Preserve numbers in item names
            const numberPattern = /\d+/g;
            const numbersInName = name.match(numberPattern);
            if (numbersInName) {
                // Avoid stripping numbers like "2000 watt"
                name = name.replace(numberPattern, (number) => `${number} `).trim();
            }
    
            // Singularize item name only if quantity is 1
            if (quantity === 1) {
                name = capitalizeWords(pluralize.singular(name)); // Capitalize and singularize
            }
    
            // Normalize "number X" to "X" in storage container
            storageContainer = storageContainer.replace(/number (\w+)/g, (match, word) => {
                return wordToNumber[word.toLowerCase()] || match;
            });
    
            // Capitalize storage container and location
            storageContainer = capitalizeWords(storageContainer);
            const formattedLocation = capitalizeWords(location);
    
            // Build the item object
            const newItem = {
                name,
                category: 'Uncategorized', // Default category
                description: '',
                quantity,
                location: formattedLocation,
                storage_container: storageContainer,
                tags,
            };
    
            // Refine the confirmation message
            const itemPlural = quantity > 1 ? pluralize.plural(name) : name; // Handle pluralization
            const confirmationMessage = `Add ${quantity} ${itemPlural} to ${storageContainer} in ${formattedLocation}${
                tags.length ? ` with tags ${tags.join(', ')}` : ''
            }?`;
    
            // Confirm and add the item
            if (window.confirm(confirmationMessage)) {
                handleSubmitFromVoice(newItem);
            }
        } else {
            alert(
                "I didn't understand that command. Try saying, 'Add 3 cordless drills to Storage Bin #5 in the Garage with tags tools and power equipment.'"
            );
        }
    };
    
    
    
    
    const handleSubmitFromVoice = (item) => {
        const formattedItem = {
            ...item,
            name: capitalizeWords(item.name),
            category: capitalizeWords(item.category),
            location: capitalizeWords(item.location),
            storage_container: capitalizeWords(item.storage_container),
            tags: item.tags.map((tag) => capitalizeWords(tag.trim())),
        };
        
        api.post('/items/', formattedItem)
        
            .then((response) => {
                console.log('Item created:', response.data);
                setItems([...items, response.data.item]); // Update the list with the new item
            })
            .catch((error) => {
                console.error('Error creating item:', error);
            });
    };
    

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            api.delete(`/items/${id}`)
                .then((response) => {
                    console.log('Item deleted:', response.data);
                    setItems(items.filter((item) => item.id !== id)); // Remove item from state
                })
                .catch((error) => {
                    console.error('Error deleting item:', error);
                });
        }
    };
    
    
    
    
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState(null);


    useEffect(() => {
        // Fetch items from the backend
        api.get('/items/')
            .then((response) => {
                console.log('Fetched items:', response.data);
                setItems(response.data);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching items:', error);
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h1>QRganizer Inventory</h1>
            <button onClick={startVoiceCommand}>Add Item with Voice</button>
        
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="name"
                    placeholder="Name"
                    value={newItem.name}
                    onChange={handleInputChange}
                    required
                />
                <input
                    type="text"
                    name="category"
                    placeholder="Category"
                    value={newItem.category}
                    onChange={handleInputChange}
                    required
                />
                <textarea
                    name="description"
                    placeholder="Description"
                    value={newItem.description}
                    onChange={handleInputChange}
                />
                <input
                    type="number"
                    name="quantity"
                    placeholder="Quantity"
                    value={newItem.quantity}
                    onChange={handleInputChange}
                    required
                />
                <input
                    type="text"
                    name="location"
                    placeholder="Location"
                    value={newItem.location}
                    onChange={handleInputChange}
                    required
                />
                <input
                    type="text"
                    name="storage_container"
                    placeholder="Storage Container"
                    value={newItem.storage_container}
                    onChange={handleInputChange}
                />
                <input
                    type="text"
                    name="tags"
                    placeholder="Tags (comma-separated)"
                    value={newItem.tags}
                    onChange={handleInputChange}
                />
                <button type="submit">Add Item</button>
            </form>

            {editingItem && (
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (editingItem && editingItem.id) {
                            const updatedItem = {
                                ...editingItem,
                                name: capitalizeWords(editingItem.name),
                                category: capitalizeWords(editingItem.category),
                                location: capitalizeWords(editingItem.location),
                                storage_container: capitalizeWords(editingItem.storage_container),
                                tags: editingItem.tags.map((tag) => capitalizeWords(tag.trim())),
                            };

                            handleUpdate(editingItem.id, updatedItem);
                        } else {
                            console.error('Error: Editing item does not have a valid ID.');
                        }
                    }}
                >
                    <h2>Edit Item</h2>
                    <input
                        type="text"
                        name="name"
                        placeholder="Name"
                        value={editingItem.name || ''}
                        onChange={(e) =>
                            setEditingItem({ ...editingItem, name: e.target.value })
                        }
                    />
                    <input
                        type="text"
                        name="category"
                        placeholder="Category"
                        value={editingItem.category || ''}
                        onChange={(e) =>
                            setEditingItem({ ...editingItem, category: e.target.value })
                        }
                    />
                    <textarea
                        name="description"
                        placeholder="Description"
                        value={editingItem.description || ''}
                        onChange={(e) =>
                            setEditingItem({
                                ...editingItem,
                                description: e.target.value,
                            })
                        }
                    />
                    <input
                        type="number"
                        name="quantity"
                        placeholder="Quantity"
                        value={editingItem.quantity || 1}
                        onChange={(e) =>
                            setEditingItem({
                                ...editingItem,
                                quantity: parseInt(e.target.value, 10),
                            })
                        }
                    />
                    <input
                        type="text"
                        name="location"
                        placeholder="Location"
                        value={editingItem.location || ''}
                        onChange={(e) =>
                            setEditingItem({ ...editingItem, location: e.target.value })
                        }
                    />
                    <input
                        type="text"
                        name="storage_container"
                        placeholder="Storage Container"
                        value={editingItem.storage_container || ''}
                        onChange={(e) =>
                            setEditingItem({
                                ...editingItem,
                                storage_container: e.target.value,
                            })
                        }
                    />
                    <input
                        type="text"
                        name="tags"
                        placeholder="Tags (comma-separated)"
                        value={editingItem.tags ? editingItem.tags.join(', ') : ''}
                        onChange={(e) =>
                            setEditingItem({
                                ...editingItem,
                                tags: e.target.value.split(',').map((tag) => tag.trim()),
                            })
                        }
                    />
                    <button type="submit">Update Item</button>
                    <button type="button" onClick={() => setEditingItem(null)}>
                        Cancel
                    </button>
                </form>
            )}

    
            {items.length > 0 ? (
                <ul>
                    {items.map((item) => (
                    <li key={item.id}>
                        <strong>{item.name}</strong>: {item.description}
                        <button onClick={() => setEditingItem({ ...item })}>Edit</button>
                        <button onClick={() => handleDelete(item.id)}>Delete</button>
                    </li>
                ))}
                </ul>
            ) : (
                <div>No items found</div>
            )}
        </div>
    );
    
}

export default App;

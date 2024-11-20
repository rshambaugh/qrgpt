import React, { useState, useEffect } from 'react';
import api from './services/api';
import pluralize from 'pluralize';
import QRCode from 'qrcode';
import { capitalizeWords } from './services/utils';
import './styles.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

function App() {
    const [newItem, setNewItem] = useState({
        name: '',
        category: '',
        description: '',
        quantity: 1,
        location: '',
        storage_container: '',
        tags: '',
        image_url: '',
    });

    const [items, setItems] = useState([]);
    const [editingItem, setEditingItem] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch items from backend
    useEffect(() => {
        const fetchItems = async () => {
            try {
                const response = await api.get('/items/');
                const validItems = response.data.filter((item) => item && item.id);
                setItems(validItems);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching items:', error);
                setLoading(false);
            }
        };
        fetchItems();
    }, []);

    // Handle input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewItem({ ...newItem, [name]: value });
    };

    // Reset form
    const resetForm = () => {
        setNewItem({
            name: '',
            category: '',
            description: '',
            quantity: 1,
            location: '',
            storage_container: '',
            tags: '',
            image_url: '',
        });
        setEditingItem(null);
    };

    // Generate QR code
    const generateQRCode = async (text) => {
        try {
            return await QRCode.toDataURL(text);
        } catch (error) {
            console.error('Error generating QR code:', error);
            return null;
        }
    };

    // Add a new item
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const qrCodeData = await generateQRCode(newItem.name || 'Unnamed Item');
    
            const formattedItem = {
                ...newItem,
                name: capitalizeWords(newItem.name || 'Unnamed Item'),
                category: capitalizeWords(newItem.category || 'No Category'),
                location: capitalizeWords(newItem.location || 'No Location'),
                storage_container: capitalizeWords(newItem.storage_container || ''),
                quantity: parseInt(newItem.quantity, 10) || 1,
                tags: newItem.tags
                    ? newItem.tags.split(',').map((tag) => capitalizeWords(tag.trim()))
                    : [],
                image_url: newItem.image_url || '', // Provide a default value
                qrCode: qrCodeData, // Attach QR code data
            };
    
            const response = await api.post('/items/', formattedItem);
    
            if (response.data && response.data.item) {
                setItems((prevItems) => [...prevItems, response.data.item]);
            } else {
                console.error('Invalid response from server:', response.data);
            }
    
            resetForm();
        } catch (error) {
            console.error('Error creating item:', error);
        }
    };
    
    

    // Edit an item
    const handleEdit = (item) => {
        setEditingItem({
            ...item,
            tags: item.tags.join(', '), // Convert tags array to a string for editing
            image_url: item.image_url || '', // Ensure image_url has a default value
        });
    };

    // Update an existing item
    const handleUpdate = async (e) => {
        e.preventDefault();
    
        try {
            // Validate that editingItem is correctly set
            if (!editingItem || !editingItem.id) {
                console.error('Editing item is invalid or does not have an ID');
                return;
            }
    
            // Construct the updated item object from editingItem
            const updatedItem = {
                ...editingItem,
                name: capitalizeWords(editingItem.name || 'Unnamed Item'),
                category: capitalizeWords(editingItem.category || 'No Category'),
                location: capitalizeWords(editingItem.location || 'No Location'),
                storage_container: capitalizeWords(editingItem.storage_container || ''),
                quantity: parseInt(editingItem.quantity, 10) || 1,
                tags: editingItem.tags
                    ? editingItem.tags.split(',').map((tag) => capitalizeWords(tag.trim()))
                    : [],
                image_url: editingItem.image_url || '', // Ensure image_url has a default value
            };
    
            // Send a PUT request to update the item
            const response = await api.put(`/items/${editingItem.id}`, updatedItem);
    
            if (!response.data || !response.data.item || !response.data.item.id) {
                console.error('Invalid response from server:', response);
                return;
            }
    
            // Update the items array with the updated item
            setItems((prevItems) =>
                prevItems.map((item) =>
                    item.id === editingItem.id ? response.data.item : item
                )
            );
    
            // Reset form and clear editing state
            setEditingItem(null);
            resetForm();
            console.log('Item updated successfully:', response.data.item);
        } catch (error) {
            console.error('Error updating item:', error);
        }
    };
    
    

    // Delete an item
    const handleDelete = async (id) => {
        try {
            if (window.confirm('Are you sure you want to delete this item?')) {
                await api.delete(`/items/${id}`);
                setItems(items.filter((item) => item.id !== id));
            }
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="app-container">
            <h1>QRganizer Inventory</h1>
    
            {/* Form and QR Scanner Placeholder */}
            <div className="form-container">
                <form
                    className="form"
                    onSubmit={editingItem ? handleUpdate : handleSubmit}
                >
                    <input
                        type="text"
                        name="name"
                        placeholder="Name"
                        value={editingItem ? editingItem.name : newItem.name}
                        onChange={(e) =>
                            editingItem
                                ? setEditingItem({ ...editingItem, name: e.target.value })
                                : setNewItem({ ...newItem, name: e.target.value })
                        }
                        required
                    />
                    <input
                        type="text"
                        name="category"
                        placeholder="Category"
                        value={editingItem ? editingItem.category : newItem.category}
                        onChange={(e) =>
                            editingItem
                                ? setEditingItem({ ...editingItem, category: e.target.value })
                                : setNewItem({ ...newItem, category: e.target.value })
                        }
                    />
                    <textarea
                        name="description"
                        placeholder="Description"
                        value={editingItem ? editingItem.description : newItem.description}
                        onChange={(e) =>
                            editingItem
                                ? setEditingItem({ ...editingItem, description: e.target.value })
                                : setNewItem({ ...newItem, description: e.target.value })
                        }
                    />
                    <input
                        type="number"
                        name="quantity"
                        placeholder="Quantity"
                        value={editingItem ? editingItem.quantity : newItem.quantity}
                        onChange={(e) =>
                            editingItem
                                ? setEditingItem({ ...editingItem, quantity: e.target.value })
                                : setNewItem({ ...newItem, quantity: e.target.value })
                        }
                    />
                    <input
                        type="text"
                        name="location"
                        placeholder="Location"
                        value={editingItem ? editingItem.location : newItem.location}
                        onChange={(e) =>
                            editingItem
                                ? setEditingItem({ ...editingItem, location: e.target.value })
                                : setNewItem({ ...newItem, location: e.target.value })
                        }
                    />
                    <input
                        type="text"
                        name="storage_container"
                        placeholder="Storage Container"
                        value={
                            editingItem ? editingItem.storage_container : newItem.storage_container
                        }
                        onChange={(e) =>
                            editingItem
                                ? setEditingItem({
                                      ...editingItem,
                                      storage_container: e.target.value,
                                  })
                                : setNewItem({ ...newItem, storage_container: e.target.value })
                        }
                    />
                    <input
                        type="text"
                        name="tags"
                        placeholder="Tags (comma-separated)"
                        value={editingItem ? editingItem.tags : newItem.tags}
                        onChange={(e) =>
                            editingItem
                                ? setEditingItem({ ...editingItem, tags: e.target.value })
                                : setNewItem({ ...newItem, tags: e.target.value })
                        }
                    />
                    <button type="submit">
                        {editingItem ? 'Update Item' : 'Add Item'}
                    </button>
                    {editingItem && (
                        <button type="button" onClick={() => setEditingItem(null)}>
                            Cancel
                        </button>
                    )}
                </form>
    
                <div className="placeholder">
                    <img
                        src="https://via.placeholder.com/300x300?text=QR+Scanner+Placeholder"
                        alt="QR Scanner Placeholder"
                    />
                </div>
            </div>
    
            {/* Inventory List */}
            <h2>Inventory</h2>
            {items.length > 0 ? (
                <div className="inventory-list">
                    {items.map(
                        (item) =>
                            item && item.id && (
                                <div className="card" key={item.id}>
                                    {/* Actions */}
                                    <div className="card-actions">
                                        <i
                                            className="fa fa-pen"
                                            onClick={() => handleEdit(item)}
                                            title="Edit"
                                        ></i>
                                        <i
                                            className="fa fa-trash"
                                            onClick={() => handleDelete(item.id)}
                                            title="Delete"
                                        ></i>
                                    </div>
    
                                    {/* Item Image */}
                                    <img
                                        src={item.image_url || 'https://via.placeholder.com/300x150'}
                                        alt={item.name || 'Unnamed Item'}
                                    />
    
                                    {/* Card Content */}
                                    <div className="card-content">
                                        <h3>{item.name || 'Unnamed Item'}</h3>
                                        <p>Category: {item.category || 'No Category'}</p>
                                        <p>Quantity: {item.quantity || 0}</p>
                                        <p>Location: {item.location || 'No Location'}</p>
                                        {item.qrCode && (
                                            <img
                                                src={item.qrCode}
                                                alt={`${item.name || 'Item'} QR Code`}
                                                className="qr-code"
                                            />
                                        )}
                                    </div>
                                </div>
                            )
                    )}
                </div>
            ) : (
                <div>No items found</div>
            )}
        </div>
    );
}
    
export default App;

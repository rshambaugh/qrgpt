import React, { useState, useEffect } from 'react';
import api from './services/api';
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
    const [showQRCode, setShowQRCode] = useState({}); // Track QR code visibility for each card
    const [searchQuery, setSearchQuery] = useState(''); // For the search input
    const [categories, setCategories] = useState({});

    // Fetch items and categories from backend
    useEffect(() => {
        const fetchItems = async () => {
            try {
                const response = await api.get('/items/');
                const validItems = response.data.filter((item) => item && item.id);

                // Wait until all QR codes are generated
                const itemsWithQRCode = await Promise.all(
                    validItems.map(async (item) => {
                        if (!item.qr_code) {
                            const qrCodeData = await generateQRCode(
                                `${item.name}, Location: ${item.location}, Container: ${item.storage_container}`
                            );
                            item.qr_code = qrCodeData;
                        }
                        return item;
                    })
                );

                // Now set items state after QR codes are ready
                setItems(itemsWithQRCode); // Update state with items containing QR codes
                setLoading(false); // Set loading to false after data is fetched
            } catch (error) {
                console.error('Error fetching items:', error);
                setLoading(false); // Set loading to false even if there's an error
            }
        };

        const fetchCategories = async () => {
            try {
                const response = await api.get('/categories/');
                if (response.data.categories) {
                    setCategories(response.data.categories); // Set categories
                } else {
                    console.error('No categories found');
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        // Trigger fetching items and categories only once on component mount
        fetchItems();
        fetchCategories();
    }, []); // Empty dependency array to run once when the component mounts

    // Search items logic
    const filteredItems = items.filter((item) => {
        const query = searchQuery.toLowerCase();
        return (
            item.name.toLowerCase().includes(query) ||
            item.category.toLowerCase().includes(query) ||
            item.tags.some((tag) => tag.toLowerCase().includes(query)) ||
            item.location.toLowerCase().includes(query) ||
            item.storage_container.toLowerCase().includes(query)
        );
    });

    // Handle voice input
    const handleVoiceInput = async () => {
        try {
            const recognition = new (window.SpeechRecognition ||
                window.webkitSpeechRecognition)();
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                console.log('Voice recognition started. Speak into the microphone.');
            };

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript.toLowerCase();
                console.log('Voice input received:', transcript);

                const parsedData = {
                    name: '',
                    category: '',
                    description: '',
                    quantity: 1, // Default quantity
                    location: '',
                    storage_container: '',
                    tags: '',
                };

                const nameMatch = transcript.match(/add (.+?) to/);
                if (nameMatch) {
                    let nameWithQuantity = nameMatch[1].trim();
                    const quantityWords = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
                    const quantityMatch = nameWithQuantity.split(' ')[0];
                    if (quantityWords.includes(quantityMatch)) {
                        parsedData.quantity = quantityWords.indexOf(quantityMatch) + 1;
                        nameWithQuantity = nameWithQuantity.replace(quantityMatch, '').trim();
                    }
                    parsedData.name = capitalizeWords(nameWithQuantity); // Capitalize properly
                }

                const categoryMatch = transcript.match(/to (.+?)(?: in| on| tagged|$)/);
                if (categoryMatch) {
                    parsedData.category = capitalizeWords(categoryMatch[1].trim());
                }

                const locationMatch = transcript.match(/in the (.+?)(?= on the| tagged with|$)/);
                if (locationMatch) {
                    parsedData.location = capitalizeWords(locationMatch[1].trim());
                }

                const containerMatch = transcript.match(/on the (.+?)(?= in the| tagged with|$)/);
                if (containerMatch) {
                    parsedData.storage_container = capitalizeWords(containerMatch[1].trim());
                }

                const tagsMatch = transcript.match(/tag(?:ged)? with (.+)/);
                if (tagsMatch) {
                    parsedData.tags = tagsMatch[1]
                        .split(/ and |,/)
                        .map((tag) => tag.trim().toLowerCase());
                }

                setNewItem((prevItem) => ({
                    ...prevItem,
                    name: parsedData.name || prevItem.name,
                    category: parsedData.category || prevItem.category,
                    description: prevItem.description, // Leave as is
                    quantity: parsedData.quantity || prevItem.quantity,
                    location: parsedData.location || prevItem.location,
                    storage_container: parsedData.storage_container || prevItem.storage_container,
                    tags: parsedData.tags.length ? parsedData.tags.join(', ') : prevItem.tags,
                }));
            };

            recognition.onerror = (event) => {
                console.error('Voice recognition error:', event.error);
            };

            recognition.start();
        } catch (error) {
            console.error('Error initializing voice recognition:', error);
        }
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
            return await QRCode.toDataURL(text || 'No Data');
        } catch (error) {
            console.error('Error generating QR code:', error);
            return null;
        }
    };

    // Add a new item
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Generate QR code for the new item
            const qrCodeData = await generateQRCode(
                `${newItem.name}, Location: ${newItem.location}, Container: ${newItem.storage_container}`
            );

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
                qr_code: qrCodeData, // Ensure QR code is included
            };

            // Send the new item to the backend
            const response = await api.post('/items/', formattedItem);

            // If the response is successful and QR code is returned, update the state
            if (response.data && response.data.qr_code) {
                setItems((prevItems) => [
                    ...prevItems,
                    { ...formattedItem, id: response.data.id, qr_code: response.data.qr_code },
                ]);
            } else {
                console.error('Invalid response from server:', response.data);
            }

            // Reset form after successful submission
            resetForm();
        } catch (error) {
            console.error('Error creating item:', error);
        }
    };

    // Edit an item
    const handleEdit = (item) => {
        setEditingItem({
            ...item,
            tags: item.tags.join(', '),
            image_url: item.image_url || '',
        });
    };

    // Update an existing item
    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            if (!editingItem || !editingItem.id) {
                console.error('Editing item is invalid or does not have an ID');
                return;
            }

            const qrCodeData = await generateQRCode(
                `${editingItem.name}, Location: ${editingItem.location}, Container: ${editingItem.storage_container}`
            );

            const updatedItem = {
                ...editingItem,
                name: capitalizeWords(editingItem.name || ''),
                category: capitalizeWords(editingItem.category || ''),
                location: capitalizeWords(editingItem.location || ''),
                storage_container: capitalizeWords(editingItem.storage_container || ''),
                tags: editingItem.tags
                    ? editingItem.tags.split(',').map((tag) => capitalizeWords(tag.trim()))
                    : [],
                image_url: editingItem.image_url || '',
                qrCode: qrCodeData,
            };

            const response = await api.put(`/items/${editingItem.id}`, updatedItem);

            if (response.data && response.data.item) {
                setItems((prevItems) =>
                    prevItems.map((item) =>
                        item.id === editingItem.id ? response.data.item : item
                    )
                );
            } else {
                console.error('Invalid response from server:', response.data);
            }

            resetForm();
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

    // Toggle QR Code display
    const handleToggleQRCode = (id) => {
        setShowQRCode((prevState) => ({
            ...prevState,
            [id]: !prevState[id],
        }));
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="app-container">
            <h1>QRganizer Inventory</h1>

            {/* Form and QR Scanner Placeholder */}
            <div className="form-container">
    <form className="form" onSubmit={editingItem ? handleUpdate : handleSubmit}>
        {/* Voice Input Button at the Top */}
        <button type="button" onClick={handleVoiceInput} className="voice-input-button">
            <i className="fa fa-microphone" aria-hidden="true"></i> Voice Input
        </button>

        {/* Form Fields */}
        <div className="form-group">
            <label htmlFor="name">Item Name</label>
            <input
                type="text"
                id="name"
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
        </div>

        <div className="form-group">
            <label htmlFor="category">Category</label>
            <input
                type="text"
                id="category"
                name="category"
                placeholder="Category"
                value={editingItem ? editingItem.category : newItem.category}
                onChange={(e) =>
                    editingItem
                        ? setEditingItem({ ...editingItem, category: e.target.value })
                        : setNewItem({ ...newItem, category: e.target.value })
                }
            />
        </div>

        <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
                id="description"
                name="description"
                placeholder="Description"
                value={editingItem ? editingItem.description : newItem.description}
                onChange={(e) =>
                    editingItem
                        ? setEditingItem({ ...editingItem, description: e.target.value })
                        : setNewItem({ ...newItem, description: e.target.value })
                }
            />
        </div>

        <div className="form-group">
            <label htmlFor="quantity">Quantity</label>
            <input
                type="number"
                id="quantity"
                name="quantity"
                placeholder="Quantity"
                value={editingItem ? editingItem.quantity : newItem.quantity}
                onChange={(e) =>
                    editingItem
                        ? setEditingItem({ ...editingItem, quantity: e.target.value })
                        : setNewItem({ ...newItem, quantity: e.target.value })
                }
            />
        </div>

        <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
                type="text"
                id="location"
                name="location"
                placeholder="Location"
                value={editingItem ? editingItem.location : newItem.location}
                onChange={(e) =>
                    editingItem
                        ? setEditingItem({ ...editingItem, location: e.target.value })
                        : setNewItem({ ...newItem, location: e.target.value })
                }
            />
        </div>

        <div className="form-group">
            <label htmlFor="storage_container">Storage Container</label>
            <input
                type="text"
                id="storage_container"
                name="storage_container"
                placeholder="Storage Container"
                value={editingItem ? editingItem.storage_container : newItem.storage_container}
                onChange={(e) =>
                    editingItem
                        ? setEditingItem({ ...editingItem, storage_container: e.target.value })
                        : setNewItem({ ...newItem, storage_container: e.target.value })
                }
            />
        </div>

        <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <input
                type="text"
                id="tags"
                name="tags"
                placeholder="Tags (comma-separated)"
                value={editingItem ? editingItem.tags : newItem.tags}
                onChange={(e) =>
                    editingItem
                        ? setEditingItem({ ...editingItem, tags: e.target.value })
                        : setNewItem({ ...newItem, tags: e.target.value })
                }
            />
        </div>

        <button type="submit">{editingItem ? 'Update Item' : 'Add Item'}</button>
        {editingItem && <button type="button" onClick={() => setEditingItem(null)}>Cancel</button>}
    </form>
        {/* Video Placeholder Section */}
    <div className="video-placeholder">
        <p>Camera Feed Placeholder</p>
        <div className="video-container">
            <img
                src="https://via.placeholder.com/600x400?text=Video+Feed"
                alt="Video Feed"
                className="video-feed"
            />
        </div>
    </div>
</div>


            {/* Inventory List */}
            <h2>Inventory</h2>
            {/* Search Bar */}
            <div className="search-bar-container">
                <input
                    type="text"
                    placeholder="Search items by name, category, tags, location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-bar"
                />
            </div>

            {items.length > 0 ? (
                <div className="inventory-list">
                    {filteredItems.map((item) => (
                        <div
                            className="card"
                            key={item.id}
                            onClick={() => handleToggleQRCode(item.id)}
                            style={{ cursor: 'pointer' }}
                        >
                            {/* Category Placeholder */}
                            <div
                                className="category-placeholder"
                                style={{
                                    backgroundColor: categories[item.category]?.color || '#E0E0E0', // Default to gray if no category color
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '150px',
                                    textAlign: 'center',
                                    color: '#FFFFFF',
                                    fontWeight: 'bold',
                                }}
                            >
                                {categories[item.category]?.icon ? (
                                    <i
                                        className={categories[item.category].icon}
                                        style={{ fontSize: '36px', marginRight: '10px' }}
                                        aria-hidden="true"
                                    ></i>
                                ) : (
                                    <i
                                        className="fa fa-question-circle"
                                        style={{ fontSize: '36px', marginRight: '10px' }}
                                        aria-hidden="true"
                                    ></i>
                                )}
                                <h3>{item.category || 'Uncategorized'}</h3>
                            </div>

                            {/* QR Code Toggle */}
                            {showQRCode[item.id] ? (
                                <div className="qr-code-container">
                                    {item.qr_code ? (
                                        <>
                                            <img
                                                src={item.qr_code}
                                                alt={`${item.name || 'Item'} QR Code`}
                                                className="qr-code"
                                            />
                                            <div className="print-button-container">
                                                <button
                                                    className="print-button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        console.log(`Printing QR Code for item: ${item.name}`);
                                                    }}
                                                >
                                                    <i className="fa fa-print" aria-hidden="true"></i> Print QR Code
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <p>Loading QR Code...</p>
                                    )}
                                </div>
                            ) : (
                                <div className="card-content">
                                    <h3>{item.name || 'Unnamed Item'}</h3>
                                    <p>Category: {item.category || 'No Category'}</p>
                                    <p>Quantity: {item.quantity || 0}</p>
                                    <p>Location: {item.location || 'No Location'}</p>
                                </div>
                            )}

                            {/* Card Actions (Edit and Delete Icons) */}
                            <div className="card-actions">
                                <i
                                    className="fa fa-pen"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit(item);
                                    }}
                                    title="Edit"
                                ></i>
                                <i
                                    className="fa fa-trash"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(item.id);
                                    }}
                                    title="Delete"
                                ></i>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div>No items found</div>
            )}
        </div>
    );
}

export default App;

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
    const [showQRCode, setShowQRCode] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [categories, setCategories] = useState({});
    const [currentContainerId, setCurrentContainerId] = useState(null); // For nested container navigation
    const [containerDetails, setContainerDetails] = useState(null); // Details of the current container
    const [showNewContainerFields, setShowNewContainerFields] = useState(false); // Manage visibility of new container fields
    const [newContainer, setNewContainer] = useState({
        name: "",
        location: "",
        tags: "",
    }); // State for new container fields
    const [containers, setContainers] = useState([]); // List of existing containers


    // Fetch items and categories from backend
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
    
                let items = [];
                if (currentContainerId) {
                    // Fetch items within a specific container
                    const response = await api.get(`/containers/${currentContainerId}`);
                    const containerData = response.data || {};
    
                    // Set container details and items
                    setContainerDetails(containerData.container || null);
                    items = containerData.items || [];
                    console.log('Items within a container:', containerData);
                } else {
                    // Fetch all items for the main inventory view
                    const response = await api.get('/items/');
                    items = response.data.items || []; // Access the 'items' key
                    console.log('Fetched items for main inventory:', items);
    
                    // Ensure all items have QR codes
                    items = await Promise.all(
                        items.map(async (item) => {
                            if (!item.qr_code) {
                                try {
                                    const qrCodeData = await generateQRCode(
                                        `Item: ${item.name}, Location: ${item.location}, Container: ${item.storage_container || 'None'}`
                                    );
                                    return { ...item, qr_code: qrCodeData };
                                } catch (qrError) {
                                    console.error('Error generating QR code for item:', item, qrError);
                                    return item; // Return item without QR code if generation fails
                                }
                            }
                            return item;
                        })
                    );
    
                    // Clear container details for the main inventory view
                    setContainerDetails(null);
                }
    
                // Set the fetched items
                setItems(items);
                console.log('Items with QR Code:', items);
    
                // Fetch and set categories
                const categoryResponse = await api.get('/categories/');
                const categories = categoryResponse.data.categories || [];
                setCategories(categories);
                console.log('Fetched Categories:', categories);
            } catch (error) {
                console.error('Error fetching items or categories:', error);
            } finally {
                setLoading(false); // Reset loading state regardless of success or failure
            }
        };
    
        const fetchContainers = async () => {
            try {
                const response = await api.get('/containers/');
                const containers = Array.isArray(response.data) ? response.data : [];
                setContainers(containers);
                console.log('Fetched Containers:', containers);
            } catch (error) {
                console.error('Error fetching containers:', error);
            }
        };
    
        fetchData();
        fetchContainers();
    }, [currentContainerId]);
    

    const filteredItems = items.filter((item) => {
        const query = searchQuery.toLowerCase();
        return (
            item.name.toLowerCase().includes(query) ||
            item.category.toLowerCase().includes(query) ||
            (item.tags || []).some((tag) => tag.toLowerCase().includes(query)) || // Ensure tags exist
            item.location.toLowerCase().includes(query)
        );
    });
    
    
        

    // Handle voice input for item creation
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
                if (!transcript.includes('add')) {
                    alert('Command not recognized. Try saying something like "Add item to category."');
                    return;
                }

                const parsedData = {
                    name: '',
                    category: '',
                    description: '',
                    quantity: 1,
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
                    parsedData.name = capitalizeWords(nameWithQuantity);
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
                    description: prevItem.description,
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
    // Generate QR code
const generateQRCode = async (text) => {
    try {
        const qrCode = await QRCode.toDataURL(text || 'No Data');
        return qrCode; // Keep the prefix intact
    } catch (error) {
        console.error('Error generating QR code:', error);
        return null;
    }
};

    

// Add a new item
// Updated handleSubmit Function
const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent form reload

    try {
        let containerId = newItem.storage_container;

        // Check if a new container needs to be created
        if (showNewContainerFields) {
            // Validate new container fields
            if (!newContainer.name || !newContainer.location) {
                alert("Please fill out the new container fields.");
                return;
            }

            // Create the new container in the backend
            const response = await api.post("/containers/", {
                name: newContainer.name,
                location: newContainer.location,
                tags: newContainer.tags ? newContainer.tags.split(",").map((tag) => tag.trim()) : [],
            });

            if (response.data && response.data.id) {
                containerId = response.data.id; // Get the new container ID
            } else {
                alert("Failed to create new container.");
                return;
            }
        }

        // Prepare item data
        const itemData = {
            ...newItem,
            storage_container: containerId, // Use the container ID
            tags: newItem.tags ? newItem.tags.split(",").map((tag) => tag.trim()) : [],
        };

        // Create the new item in the backend
        const itemResponse = await api.post("/items/", itemData);

        if (itemResponse.data && itemResponse.data.id) {
            // Update the items state with the newly added item
            setItems([...items, { ...itemData, id: itemResponse.data.id }]);
            // Reset the form
            resetForm(); // Clear the item form
            setNewContainer({ name: "", location: "", tags: "" }); // Clear the new container fields
            setShowNewContainerFields(false); // Hide the new container fields
        } else {
            alert("Failed to create item.");
        }
    } catch (error) {
        console.error("Error creating item:", error);
        alert("An error occurred while adding the item.");
    }
};


// Edit an item
const handleEdit = (item) => {
    try {
        // Ensure tags is always processed as an array
        const tags = Array.isArray(item.tags) ? item.tags : (item.tags || '').split(',');

        // Set the editing item with pre-processed tags and container field
        setEditingItem({
            ...item,
            tags: tags.join(', '), // Convert tags array back to a comma-separated string for editing
            storage_container: item.storage_container || "", // Pre-select existing container or leave blank
        });

        // Log for debugging
        console.log('Editing item:', item);
        console.log('Item tags:', tags);

        // Automatically toggle the 'new container' fields off if editing
        setShowNewContainerFields(false);
    } catch (error) {
        console.error('Error handling item edit:', error);
    }
};

    

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            // If adding a new container
            if (showNewContainerFields && newContainer.name) {
                const newContainerResponse = await api.post('/containers/', {
                    name: newContainer.name,
                    location: newContainer.location,
                    tags: newContainer.tags
                        ? newContainer.tags.split(',').map((tag) => tag.trim()) // Ensure tags are sent as a list
                        : [],
                });
    
                if (newContainerResponse.status === 201) {
                    const createdContainer = newContainerResponse.data;
                    editingItem.storage_container = createdContainer.id; // Link the new container to the item
                } else {
                    console.error('Error creating container:', newContainerResponse.data);
                    return; // Exit if container creation fails
                }
            }
    
            // Prepare the updated item payload
            const updatedItem = {
                ...editingItem,
                storage_container: editingItem.storage_container
                    ? parseInt(editingItem.storage_container, 10) // Ensure container ID is an integer
                    : null,
                tags: editingItem.tags
                    ? editingItem.tags.split(',').map((tag) => tag.trim()) // Ensure tags are a list
                    : [],
                qr_code: editingItem.qr_code || null, // Include the existing QR code if present
            };
    
            console.log('Payload to API:', updatedItem); // Debugging log to confirm payload
    
            // Update the item in the backend
            const response = await api.put(`/items/${editingItem.id}`, updatedItem);
    
            if (response.status === 200) {
                console.log('Item updated successfully:', response.data);
                
                // Refresh items list from the backend
                const refreshedItems = await api.get('/items/');
                setItems(refreshedItems.data);
    
                resetForm(); // Clear the form after a successful update
            } else {
                console.error('Error updating item:', response.data);
            }
        } catch (error) {
            console.error('Error in handleUpdate:', error.response?.data || error.message);
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

    const handleNavigateToContainer = (containerId) => {
        setCurrentContainerId(containerId);
    };

    const handleNavigateBack = () => {
        if (containerDetails?.parent_container_id) {
            setCurrentContainerId(containerDetails.parent_container_id);
        } else {
            setCurrentContainerId(null);
        }
    };

    if (loading) {
        return <div className="loading">Loading Inventory...</div>;
    }
    
    return (
        <div className="app-container">
            <h1>QRganizer Inventory</h1>

            {currentContainerId && (
                <button onClick={handleNavigateBack}>
                    <i className="fa fa-arrow-left"></i> Back
                </button>
            )}

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
                placeholder="Enter category (e.g., Electronics, Tools)"
                value={editingItem ? editingItem.category : newItem.category}
                onChange={(e) => {
                    const value = e.target.value.trim();
                    console.log('Updated Category:', value);
                    editingItem
                        ? setEditingItem({ ...editingItem, category: value })
                        : setNewItem({ ...newItem, category: value });
                }}
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

        {/* Existing or New Container Selection */}
        <div className="form-group">
            <label htmlFor="container-selection">Container</label>
            <select
                id="container-selection"
                value={editingItem ? editingItem.storage_container || "" : newItem.storage_container || ""}
                onChange={(e) => {
                    const value = e.target.value;
                    if (editingItem) {
                        setEditingItem({ ...editingItem, storage_container: value });
                    } else {
                        setNewItem({ ...newItem, storage_container: value });
                    }

                    if (value === "new") {
                        setShowNewContainerFields(true); // Show new container fields
                    } else {
                        setShowNewContainerFields(false); // Hide new container fields
                    }
                }}
                className="dropdown-field"
            >
                <option value="">Select Existing Container</option>
                {containers.map((container) => (
                    <option key={container.id} value={container.id}>
                        {container.name} ({container.location || "No Location"})
                    </option>
                ))}
                <option value="new">Add New Container</option>
            </select>

        </div>


        {/* New Container Fields */}
        {showNewContainerFields && (
            <div className="new-container-fields">
                <div className="form-group">
                    <label htmlFor="new-container-name">New Container Name</label>
                    <input
                        type="text"
                        id="new-container-name"
                        placeholder="Container Name"
                        value={newContainer.name || ""}
                        onChange={(e) =>
                            setNewContainer({ ...newContainer, name: e.target.value })
                        }
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="new-container-location">New Container Location</label>
                    <input
                        type="text"
                        id="new-container-location"
                        placeholder="Container Location"
                        value={newContainer.location || ""}
                        onChange={(e) =>
                            setNewContainer({ ...newContainer, location: e.target.value })
                        }
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="new-container-tags">New Container Tags</label>
                    <input
                        type="text"
                        id="new-container-tags"
                        placeholder="Tags (comma-separated)"
                        value={newContainer.tags || ""}
                        onChange={(e) =>
                            setNewContainer({ ...newContainer, tags: e.target.value })
                        }
                    />
                </div>
            </div>
        )}


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
            {/* Submit and Cancel Buttons */}
        <div className="form-buttons">
            <button
                type="submit"
                className="form-button save-button"
            >
                {editingItem ? 'Update Item' : 'Add Item'}
            </button>
            {editingItem && (
                <button
                    type="button"
                    className="form-button cancel-button"
                    onClick={resetForm}
                >
                    Cancel
                </button>
            )}
        </div>

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
                            onClick={() => {
                                if (item.is_container) {
                                    handleNavigateToContainer(item.id); // Navigate to the nested container
                                } else {
                                    handleToggleQRCode(item.id); // Show QR code for items
                                }
                            }}
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

                            {/* QR Code or Item Details */}
                            <div className={`item-card-content ${showQRCode[item.id] ? 'qr-code-visible' : ''}`}>
                                {showQRCode[item.id] ? (
                                    <div className="qr-code-container">
                                        {item.qr_code ? (
                                            <img src={item.qr_code} alt={`QR code for ${item.name}`} />
                                        ) : (
                                            <p>Loading QR Code...</p> // Fallback for when QR code is not ready
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <h3>{item.name || 'Unnamed Item'}</h3>
                                        <p>Category: {item.category || 'No Category'}</p>
                                        <p>Quantity: {item.quantity || 0}</p>
                                        <p>Location: {item.location || 'No Location'}</p>
                                    </>
                                )}
                            </div>

                            {/* Card Actions (Edit and Delete Icons) */}
                            {!item.is_container && (
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
                            )}
                        </div>
                    ))}
                </div>


            ) : (
                <div>No items found</div>
            )}


            <h2>Containers</h2>
            <div className="container-list">
                {containers.length > 0 ? (
                    containers.map((container) => (
                        <div
                            className="card"
                            key={container.id}
                            onClick={() => handleNavigateToContainer(container.id)} // Navigate to the container
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="card-content">
                                <h3>{container.name || 'Unnamed Container'}</h3>
                                <p>Location: {container.location || 'No Location'}</p>
                                <p>Tags: {container.tags?.join(', ') || 'No Tags'}</p>
                            </div>
                            {/* Removed QR Code logic from containers */}
                        </div>
                    ))
                ) : (
                    <div>No containers found</div>
                )}
            </div>

        </div>

    );
}

export default App;
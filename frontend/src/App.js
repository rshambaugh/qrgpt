import React, { useState, useEffect } from 'react';
import apiClient from './services/apiClient'; // Updated Axios client
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

    // Fetch items, categories, and containers from backend
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                if (currentContainerId) {
                    // Fetch items within a specific container
                    const response = await apiClient.get(`/containers/${currentContainerId}`);
                    setContainerDetails(response.data.container); // Set the container details
                    setItems(response.data.items || []);
                } else {
                    // Fetch all items for the main inventory view
                    const response = await apiClient.get('/items/');
                    const validItems = response.data.filter((item) => item && item.id);

                    // Generate QR codes for items missing QR codes
                    const itemsWithQRCode = await Promise.all(
                        validItems.map(async (item) => {
                            if (!item.qr_code) {
                                const qrCodeData = await generateQRCode(
                                    `${item.name}, Location: ${item.location}, Container: ${item.storage_container || 'None'}`
                                );
                                item.qr_code = qrCodeData;
                            }
                            return item;
                        })
                    );

                    setItems(itemsWithQRCode);
                    console.log("Items with QR Code:", itemsWithQRCode);

                    setContainerDetails(null);
                }

                // Fetch and set categories
                const categoryResponse = await apiClient.get('/categories/');
                if (categoryResponse.data.categories) {
                    setCategories(categoryResponse.data.categories);
                }

                setLoading(false);
            } catch (error) {
                console.error('Error fetching items or categories:', error);
                setLoading(false);
            }
        };

        fetchData();

        const fetchContainers = async () => {
            try {
                const response = await apiClient.get('/containers/');
                console.log('Fetched Containers:', response.data); // Debug log
                setContainers(response.data);
            } catch (error) {
                console.error('Error fetching containers:', error);
            }
        };

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
            const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
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
                    tags: [],
                };

                // Extract item name and quantity
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

                // Extract category
                const categoryMatch = transcript.match(/to (.+?)(?: in| on| tagged|$)/);
                if (categoryMatch) {
                    parsedData.category = capitalizeWords(categoryMatch[1].trim());
                }

                // Extract location
                const locationMatch = transcript.match(/in the (.+?)(?= on the| tagged with|$)/);
                if (locationMatch) {
                    parsedData.location = capitalizeWords(locationMatch[1].trim());
                }

                // Extract container
                const containerMatch = transcript.match(/on the (.+?)(?= in the| tagged with|$)/);
                if (containerMatch) {
                    parsedData.storage_container = capitalizeWords(containerMatch[1].trim());
                }

                // Extract tags
                const tagsMatch = transcript.match(/tag(?:ged)? with (.+)/);
                if (tagsMatch) {
                    parsedData.tags = tagsMatch[1]
                        .split(/ and |,/)
                        .map((tag) => tag.trim().toLowerCase());
                }

                // Update state with parsed data
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
const generateQRCode = async (text) => {
    try {
        const qrCode = await QRCode.toDataURL(text || 'No Data');
        return qrCode.replace(/^data:image\/png;base64,/, ''); // Strip the prefix
    } catch (error) {
        console.error('Error generating QR code:', error);
        return null;
    }
};

// Add a new item
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
            const response = await apiClient.post("/containers/", {
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
            storage_container: containerId || null, // Use the container ID or null
            tags: newItem.tags ? newItem.tags.split(",").map((tag) => tag.trim()) : [],
        };

        // Create the new item in the backend
        const itemResponse = await apiClient.post("/items/", itemData);

        if (itemResponse.data && itemResponse.data.id) {
            // Update the items state with the newly added item
            setItems([...items, { ...itemData, id: itemResponse.data.id, qr_code: itemResponse.data.qr_code }]);
            resetForm(); // Clear the form
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
    setEditingItem({
        ...item,
        tags: item.tags.join(', '),
        storage_container: item.storage_container || "", // Pre-select existing container or leave blank
    });

    // Automatically toggle the 'new container' fields off if editing
    setShowNewContainerFields(false);
};

// Update an item
const handleUpdate = async (e) => {
    e.preventDefault();
    try {
        // If adding a new container
        if (showNewContainerFields && newContainer.name) {
            const newContainerResponse = await apiClient.post('/containers/', {
                name: newContainer.name,
                location: newContainer.location,
                tags: newContainer.tags
                    ? newContainer.tags.split(',').map((tag) => tag.trim()) // Ensure tags are sent as a list
                    : [],
            });

            if (newContainerResponse.data && newContainerResponse.data.id) {
                editingItem.storage_container = newContainerResponse.data.id; // Link the new container to the item
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
        const response = await apiClient.put(`/items/${editingItem.id}`, updatedItem);

        if (response.status === 200) {
            console.log('Item updated successfully:', response.data);

            // Refresh items list from the backend
            const refreshedItems = await apiClient.get('/items/');
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
            await apiClient.delete(`/items/${id}`);
            setItems(items.filter((item) => item.id !== id));
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        alert("An error occurred while deleting the item.");
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
                {/* Voice Input Button */}
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
                                ? setEditingItem({ ...editingItem, quantity: parseInt(e.target.value, 10) || 1 })
                                : setNewItem({ ...newItem, quantity: parseInt(e.target.value, 10) || 1 })
                        }
                        min="1"
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
            </form>
        </div>
    </div>
);


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
{/* Video Placeholder Section */}
<div className="video-placeholder">
    <p>Camera Feed Placeholder</p>
    <div className="video-container">
        {/* Replace this image with actual video feed when ready */}
        <img
            src="https://via.placeholder.com/600x400?text=Video+Feed"
            alt="Video Feed Placeholder"
            className="video-feed"
        />
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
                                <img
                                    src={
                                        item.qr_code?.startsWith("data:image/png;base64,data:image/png;base64,")
                                            ? item.qr_code.replace("data:image/png;base64,data:image/png;base64,", "data:image/png;base64,") // Remove duplicate prefix
                                            : item.qr_code
                                    }
                                    alt="QR Code"
                                    style={{ maxWidth: "100%", height: "auto" }}
                                />
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
<>
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
                </div>
            ))
        ) : (
            <div>No containers found</div>
        )}
    </div>
</>



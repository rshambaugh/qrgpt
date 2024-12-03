import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { capitalizeWords } from './services/utils';
import './styles.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import apiClient from './services/api'; // Updated path to match `api.js`

function App() {
    const [newItem, setNewItem] = useState({
        name: "",
        category: "",
        description: "",
        quantity: 1,
        location: "",
        storage_container_id: null,
        tags: "",
        image_url: "",
    });
    

    const [items, setItems] = useState([]);
    const [editingItem, setEditingItem] = useState({
        id: null,
        name: "",
        category: "",
        description: "",
        quantity: null,
        location: "",
        storage_container_id: null,
        tags: "",
        qr_code: "",
      });    const [loading, setLoading] = useState(true);
    const [showQRCode, setShowQRCode] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [categories, setCategories] = useState({});
    const [currentContainerId, setCurrentContainerId] = useState(null); // For nested container navigation
    const [containerDetails, setContainerDetails] = useState(null); // Details of the current container
    const [showNewContainerFields, setShowNewContainerFields] = useState(false);
    const [newContainer, setNewContainer] = useState({
        name: '',
        location: '',
        tags: '',
    });
    const [containers, setContainers] = useState([]);

    // Fetch items, categories, and containers from backend
    useEffect(() => {
        const fetchData = async () => {
          setLoading(true);
          try {
            const [itemsResponse, categoriesResponse, containersResponse] = await Promise.all([
              apiClient.get("/items/"),
              apiClient.get("/categories/"),
              apiClient.get("/containers/"),
            ]);
      
            setItems(itemsResponse.data || []);
            setCategories(categoriesResponse.data.categories || {});
            setContainers(containersResponse.data || []);
          } catch (error) {
            console.error("Error fetching data:", error);
          } finally {
            setLoading(false);
          }
        };
      
        fetchData();
      
        console.log("Current editingItem:", editingItem);
      }, [editingItem, currentContainerId, containerDetails]);


      const [isEditing, setIsEditing] = useState(false);


    // Filter items based on search query
    const filteredItems = items.filter((item) => {
        const query = searchQuery.toLowerCase();
        return (
            item.name.toLowerCase().includes(query) ||
            item.category.toLowerCase().includes(query) ||
            (item.tags || []).some((tag) => tag.toLowerCase().includes(query)) ||
            item.location.toLowerCase().includes(query)
        );
    });

    // Handle voice input for item creation
    const handleVoiceInput = async () => {
        try {
            const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognition.lang = 'en-US';

            recognition.onstart = () => console.log('Voice recognition started. Speak into the microphone.');

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript.toLowerCase();

                if (!transcript.includes('add')) {
                    alert('Command not recognized. Try saying something like "Add item to category."');
                    return;
                }

                const parsedData = parseVoiceInput(transcript);

                setNewItem((prevItem) => ({
                    ...prevItem,
                    ...parsedData,
                }));
            };

            recognition.onerror = (event) => console.error('Voice recognition error:', event.error);
            recognition.start();
        } catch (error) {
            console.error('Error initializing voice recognition:', error);
        }
    };

    const parseVoiceInput = (transcript) => {
        const parsedData = {
            name: '',
            category: '',
            description: '',
            quantity: 1,
            location: '',
            storage_container_id: null,
            tags: '',
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

        // Extract category, location, and tags
        const categoryMatch = transcript.match(/to (.+?)(?: in| on| tagged|$)/);
        if (categoryMatch) parsedData.category = capitalizeWords(categoryMatch[1].trim());

        const locationMatch = transcript.match(/in the (.+?)(?= on the| tagged with|$)/);
        if (locationMatch) parsedData.location = capitalizeWords(locationMatch[1].trim());

        const containerMatch = transcript.match(/on the (.+?)(?= in the| tagged with|$)/);
        if (containerMatch) parsedData.storage_container_id = capitalizeWords(containerMatch[1].trim());

        const tagsMatch = transcript.match(/tag(?:ged)? with (.+)/);
        if (tagsMatch) {
            parsedData.tags = tagsMatch[1]
                .split(/ and |,/)
                .map((tag) => tag.trim())
                .join(', ');
        }

        return parsedData;
    };

    // Reset form to default state
    const resetForm = () => {
        setEditingItem(null);
        setNewItem({
            name: '',
            category: '',
            description: '',
            quantity: 1,
            location: '',
            storage_container_id: null,
            tags: '',
            image_url: ''
        });
    };
    
    

    // Generate QR code
    const generateQRCode = async (data) => {
        try {
            const response = await apiClient.post('/generate-qr', { data });
            return response.data.qr_code; // Return the generated QR code
        } catch (error) {
            console.error('Error generating QR code:', error);
            throw error;
        }
    };
    

    // Add a new item
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent form reload

        try {
            let containerId = newItem.storage_container_id;

            // Check if a new container needs to be created
            if (showNewContainerFields) {
                // Validate new container fields
                if (!newContainer.name || !newContainer.location) {
                    alert('Please fill out the new container fields.');
                    return;
                }

                // Create the new container in the backend
                const response = await apiClient.post('/containers/', {
                    name: newContainer.name,
                    location: newContainer.location,
                    tags: newContainer.tags ? newContainer.tags.split(',').map((tag) => tag.trim()) : [],
                });

                if (response.data && response.data.id) {
                    containerId = response.data.id; // Get the new container ID
                } else {
                    alert('Failed to create new container.');
                    return;
                }
            }

            // Prepare item data
            const itemData = {
                ...newItem,
                storage_container_id: containerId || null, // Use the container ID or null
                tags: newItem.tags ? newItem.tags.split(',').map((tag) => tag.trim()) : [],
            };

            // Create the new item in the backend
            const itemResponse = await apiClient.post('/items/', itemData);

            if (itemResponse.data && itemResponse.data.id) {
                // Update the items state with the newly added item
                setItems([...items, { ...itemData, id: itemResponse.data.id, qr_code: itemResponse.data.qr_code }]);
                resetForm(); // Clear the form
            } else {
                alert('Failed to create item.');
            }
        } catch (error) {
            console.error('Error creating item:', error);
            alert('An error occurred while adding the item.');
        }
    };

    // Edit an item
    const handleEdit = (item) => {
        setIsEditing(true);
        setEditingItem({
          ...item,
          storage_container_id: item.storage_container_id || null,
          tags: item.tags.join(", "),
        });
        setShowNewContainerFields(false);
      };
      
      const handleAdd = async (e) => {
        e.preventDefault();
        try {
          const newItem = {
            ...editingItem,
            tags: editingItem.tags
              ? editingItem.tags.split(",").map((tag) => tag.trim())
              : [],
          };
          const response = await apiClient.post("/items", newItem);
          setItems([...items, response.data]);
          resetForm();
        } catch (error) {
          console.error("Error adding new item:", error);
          alert("Failed to add the item. Please try again.");
        }
      };
      
    
    // Update an item
    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            // Step 1: Handle new container creation if applicable
            let containerId = editingItem.storage_container_id;
    
            if (showNewContainerFields && newContainer.name) {
                const containerResponse = await apiClient.post('/containers/', {
                    name: newContainer.name,
                    location: newContainer.location,
                    tags: newContainer.tags
                        ? newContainer.tags.split(',').map((tag) => tag.trim())
                        : [],
                });
                containerId = containerResponse.data.id; // Update containerId with the new container's ID
            }
    
            // Step 2: Generate a new QR code for the updated item
            const qrCodeResponse = await apiClient.post('/generate-qr', {
                data: editingItem.name, // Pass the item's name or unique identifier
            });
            const qrCode = qrCodeResponse.data.qr_code; // Retrieve the QR code from the API response
    
            // Step 3: Prepare the updated item payload
            const updatedItem = {
                ...editingItem,
                storage_container_id: containerId || null, // Ensure it's either a valid ID or null
                tags: editingItem.tags
                    ? editingItem.tags.split(',').map((tag) => tag.trim())
                    : [], // Split and clean tags
                qr_code: qrCode, // Attach the newly generated QR code
            };
    
            // Log the updated item to the console to check the payload
            console.log("Updated Item Payload:", updatedItem); // <-- Add this line
    
            // Step 4: Send the updated item to the backend
            const response = await apiClient.put(`/items/${editingItem.id}`, updatedItem);
    
            // Step 5: Update the frontend state with the modified item
            setItems(
                items.map((item) =>
                    item.id === editingItem.id ? response.data : item
                )
            );
    
            // Step 6: Reset the form and close any edit mode
            resetForm();
        } catch (error) {
            console.error('Error updating item:', error);
            alert('Failed to update the item. Please try again.');
        }
    };
    
    // Delete an item
    const handleDelete = async (id) => {
        try {
            if (window.confirm("Are you sure you want to delete this item?")) {
                await apiClient.delete(`/items/${id}`);
                setItems(items.filter((item) => item.id !== id));
            }
        } catch (error) {
            console.error("Error deleting item:", error);
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

    // Navigate to a specific container
    const handleNavigateToContainer = (containerId) => {
        setCurrentContainerId(containerId);
    };

    // Navigate back to the parent container or main inventory
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
    
            {/* Back Button for Nested Navigation */}
            {currentContainerId && (
                <button onClick={handleNavigateBack} className="back-button">
                    <i className="fa fa-arrow-left" aria-hidden="true"></i> Back
                </button>
            )}
    
            {/* Form and Video Placeholder Container */}
            <div className="form-container">
                {/* Form Section */}
                <form className="form" onSubmit={editingItem ? handleUpdate : handleSubmit}>
                    {/* Voice Input Button */}
                    <button
                        type="button"
                        onClick={handleVoiceInput}
                        className="voice-input-button"
                    >
                        <i className="fa fa-microphone" aria-hidden="true"></i> Voice Input
                    </button>

                    {/* Form Fields */}
                    <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            placeholder="Item Name"
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
                            required
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
                            placeholder="1"
                            value={editingItem ? editingItem.quantity : newItem.quantity}
                            onChange={(e) =>
                                editingItem
                                    ? setEditingItem({ ...editingItem, quantity: parseInt(e.target.value, 10) })
                                    : setNewItem({ ...newItem, quantity: parseInt(e.target.value, 10) })
                            }
                            required
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
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="storageContainer">Storage Container</label>
                        <select
                            id="storage_container"
                            name="storage_container"
                            value={
                                editingItem
                                    ? editingItem.storage_container_id || ''
                                    : newItem.storage_container_id || ''
                            }
                            onChange={(e) => {
                                const selectedId = parseInt(e.target.value, 10);
                                if (editingItem) {
                                    setEditingItem((prevItem) => ({
                                        ...prevItem,
                                        storage_container_id: isNaN(selectedId) ? null : selectedId,
                                    }));
                                } else {
                                    setNewItem((prevItem) => ({
                                        ...prevItem,
                                        storage_container_id: isNaN(selectedId) ? null : selectedId,
                                    }));
                                }
                            }}
                        >
                            <option value="" disabled>
                                Select a container
                            </option>
                            {containers.map((container) => (
                                <option key={container.id} value={container.id}>
                                    {container.name}
                                </option>
                            ))}
                        </select>
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

                    <div className="form-group">
                        <label htmlFor="imageUrl">Image URL</label>
                        <input
                            type="text"
                            id="imageUrl"
                            name="imageUrl"
                            placeholder="Image URL"
                            value={editingItem ? editingItem.image_url : newItem.image_url}
                            onChange={(e) =>
                                editingItem
                                    ? setEditingItem({ ...editingItem, image_url: e.target.value })
                                    : setNewItem({ ...newItem, image_url: e.target.value })
                            }
                        />
                    </div>

                    {/* Form Buttons */}
                    <div className="form-buttons">
                        <button type="submit" className="form-button save-button">
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
                            src="https://via.placeholder.com/400x300?text=Video+Feed"
                            alt="Video Feed Placeholder"
                            className="video-feed"
                        />
                    </div>
                </div>
            </div>


            {/* Inventory Section */}
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

            {/* Inventory List */}
            {items.length > 0 ? (
                <div className="inventory-list">
                    {filteredItems.map((item) => (
                        <div
                            className="card"
                            key={item.id}
                            onClick={() =>
                                item.is_container
                                    ? handleNavigateToContainer(item.id)
                                    : handleToggleQRCode(item.id)
                            }
                            style={{ cursor: "pointer" }}
                        >
                            {/* Category Display */}
                            <div
                                className="category-placeholder"
                                style={{
                                    backgroundColor:
                                        categories[item.category]?.color || "#E0E0E0",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "150px",
                                    textAlign: "center",
                                    color: "#FFFFFF",
                                    fontWeight: "bold",
                                }}
                            >
                                {categories[item.category]?.icon ? (
                                    <i
                                        className={categories[item.category].icon}
                                        style={{ fontSize: "36px", marginRight: "10px" }}
                                        aria-hidden="true"
                                    ></i>
                                ) : (
                                    <i
                                        className="fa fa-question-circle"
                                        style={{ fontSize: "36px", marginRight: "10px" }}
                                        aria-hidden="true"
                                    ></i>
                                )}
                                <h3>{item.category || "Uncategorized"}</h3>
                            </div>

                            {/* Item Details */}
                            <div
                                className={`item-card-content ${
                                    showQRCode[item.id] ? "qr-code-visible" : ""
                                }`}
                            >
                                {showQRCode[item.id] ? (
                                    <div className="qr-code-container">
                                        {item.qr_code ? (
                                            <img
                                                src={item.qr_code}
                                                alt="QR Code"
                                                style={{ maxWidth: "100%", height: "auto" }}
                                            />
                                        ) : (
                                            <p>Loading QR Code...</p>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <h3>{item.name || "Unnamed Item"}</h3>
                                        <p>Category: {item.category || "No Category"}</p>
                                        <p>Quantity: {item.quantity || 0}</p>
                                        <p>Location: {item.location || "No Location"}</p>
                                    </>
                                )}
                            </div>

                            {/* Item Actions */}
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

            {/* Containers Section */}
            <h2>Containers</h2>
            <div className="container-list">
                {containers.length > 0 ? (
                    containers.map((container) => (
                        <div
                            className="card"
                            key={container.id}
                            onClick={() => handleNavigateToContainer(container.id)}
                            style={{ cursor: "pointer" }}
                        >
                            <div className="card-content">
                                <h3>{container.name || "Unnamed Container"}</h3>
                                <p>Location: {container.location || "No Location"}</p>
                                <p>Tags: {container.tags?.join(", ") || "No Tags"}</p>
                            </div>
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

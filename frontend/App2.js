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

    // Fetch items and categories from backend
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                if (currentContainerId) {
                    // Fetch items within a specific container
                    const response = await api.get(`/containers/${currentContainerId}`);
                    setContainerDetails(response.data.container); // Set the container details
                    setItems(response.data.items || []);
                } else {
                    // Fetch all items for the main inventory view
                    const response = await api.get('/items/');
                    const validItems = response.data.filter((item) => item && item.id);

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

                    setItems(itemsWithQRCode);
                    setContainerDetails(null);
                }

                // Fetch and set categories
                const categoryResponse = await api.get('/categories/');
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
    }, [currentContainerId]);

    // Filter items based on search query
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
                console.log('Voice input received:', transcript);

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

    const generateQRCode = async (text) => {
        try {
            return await QRCode.toDataURL(text || 'No Data');
        } catch (error) {
            console.error('Error generating QR code:', error);
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
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
                qr_code: qrCodeData,
            };

            const response = await api.post('/items/', formattedItem);

            if (response.data && response.data.qr_code) {
                setItems((prevItems) => [
                    ...prevItems,
                    { ...formattedItem, id: response.data.id, qr_code: response.data.qr_code },
                ]);
            } else {
                console.error('Invalid response from server:', response.data);
            }

            resetForm();
        } catch (error) {
            console.error('Error creating item:', error);
        }
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

    if (loading) return <div>Loading...</div>;

    return (
        <div className="app-container">
            <h1>QRganizer Inventory</h1>

            {currentContainerId && (
                <button onClick={handleNavigateBack}>
                    <i className="fa fa-arrow-left"></i> Back
                </button>
            )}

            {/* Render other components here */}
        </div>
    );
}

export default App;

import React, { useState } from 'react';

const AddItemForm = ({ onAddItem }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onAddItem({ name, description });
        setName('');
        setDescription('');
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3>Add New Item</h3>
            <input
                type="text"
                placeholder="Item Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />
            <button type="submit">Add Item</button>
        </form>
    );
};

export default AddItemForm;

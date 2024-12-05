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
        <form onSubmit={handleSubmit} className="mb-3">
            <div className="mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Item Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>
            <div className="mb-3">
                <textarea
                    className="form-control"
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>
            <button type="submit" className="btn btn-success w-100">
                Add Item
            </button>
        </form>
    );
};

export default AddItemForm;

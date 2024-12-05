import React, { useState } from 'react';

const AddSpaceForm = ({ onAddSpace }) => {
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onAddSpace({ name });
        setName('');
    };

    return (
        <form onSubmit={handleSubmit}>
            <h3>Add New Space</h3>
            <input
                type="text"
                placeholder="Space Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <button type="submit">Add Space</button>
        </form>
    );
};

export default AddSpaceForm;

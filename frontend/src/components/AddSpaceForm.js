import React, { useState } from 'react';

const AddSpaceForm = ({ onAddSpace }) => {
    const [name, setName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onAddSpace({ name });
        setName('');
    };

    return (
        <form onSubmit={handleSubmit} className="mb-3">
            <div className="mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Space Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>
            <button type="submit" className="btn btn-primary w-100">
                Add Space
            </button>
        </form>
    );
};

export default AddSpaceForm;

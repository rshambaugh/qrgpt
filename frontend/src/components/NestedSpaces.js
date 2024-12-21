import React, { useState } from "react";
import PropTypes from "prop-types";
import "../styles/AddForm.css"; // Restored CSS styling

const AddForm = ({
  spaces,
  newSpaceName,
  setNewSpaceName,
  newSpaceParentId,
  setNewSpaceParentId,
  newItemName,
  setNewItemName,
  newItemDescription,
  setNewItemDescription,
  newItemSpaceId,
  setNewItemSpaceId,
  fetchSpaces,
  fetchItems,
  onEditSpace, // Added for editing spaces
}) => {
  const [errorMessage, setErrorMessage] = useState(null);

  const handleAddSpace = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!newSpaceName.trim()) {
      setErrorMessage("Space name cannot be empty.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/spaces/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSpaceName,
          parent_id: newSpaceParentId || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrorMessage(errorData.detail || "Failed to add space.");
        return;
      }

      setNewSpaceName("");
      setNewSpaceParentId(null);
      fetchSpaces();
    } catch (error) {
      console.error("Error adding space:", error);
      setErrorMessage("An error occurred while adding the space.");
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!newItemName.trim()) {
      setErrorMessage("Item name cannot be empty.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/items/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newItemName,
          description: newItemDescription,
          space_id: newItemSpaceId || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrorMessage(errorData.detail || "Failed to add item.");
        return;
      }

      setNewItemName("");
      setNewItemDescription("");
      setNewItemSpaceId(null);
      fetchItems();
    } catch (error) {
      console.error("Error adding item:", error);
      setErrorMessage("An error occurred while adding the item.");
    }
  };

  const renderSpaceOptions = (spaces, depth = 0) => {
    return spaces.map((space) => (
      <option
        key={space.id}
        value={space.id}
        style={{ paddingLeft: `${(space.depth || 0) * 15}px` }}
      >
        {"-".repeat(space.depth || 0)} {space.name}
      </option>
    ));
  };

  return (
    <div className="add-form-container">
      <h2 className="form-header">Add New Space</h2>
      <form onSubmit={handleAddSpace} className="add-form">
        <input
          type="text"
          placeholder="Space Name"
          value={newSpaceName}
          onChange={(e) => setNewSpaceName(e.target.value)}
        />
        <select
          value={newSpaceParentId || ""}
          onChange={(e) =>
            setNewSpaceParentId(e.target.value ? Number(e.target.value) : null)
          }
        >
          <option value="">Select Parent Space (optional)</option>
          {renderSpaceOptions(spaces)}
        </select>
        <button type="submit">Add Space</button>
      </form>

      <h2 className="form-header">Add New Item</h2>
      <form onSubmit={handleAddItem} className="add-form">
        <input
          type="text"
          placeholder="Item Name"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
        />
        <textarea
          placeholder="Item Description"
          value={newItemDescription}
          onChange={(e) => setNewItemDescription(e.target.value)}
        ></textarea>
        <select
          value={newItemSpaceId || ""}
          onChange={(e) =>
            setNewItemSpaceId(e.target.value ? Number(e.target.value) : null)
          }
        >
          <option value="">Select Space</option>
          {renderSpaceOptions(spaces)}
        </select>
        <button type="submit">Add Item</button>
      </form>

      {errorMessage && <p className="error-message">{errorMessage}</p>}
    </div>
  );
};

AddForm.propTypes = {
  spaces: PropTypes.array.isRequired,
  newSpaceName: PropTypes.string.isRequired,
  setNewSpaceName: PropTypes.func.isRequired,
  newSpaceParentId: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf([null])]),
  setNewSpaceParentId: PropTypes.func.isRequired,
  newItemName: PropTypes.string.isRequired,
  setNewItemName: PropTypes.func.isRequired,
  newItemDescription: PropTypes.string.isRequired,
  setNewItemDescription: PropTypes.func.isRequired,
  newItemSpaceId: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf([null])]),
  setNewItemSpaceId: PropTypes.func.isRequired,
  fetchSpaces: PropTypes.func.isRequired,
  fetchItems: PropTypes.func.isRequired,
  onEditSpace: PropTypes.func.isRequired,
};

export default AddForm;

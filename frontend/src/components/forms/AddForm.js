import React from "react";

const AddForm = ({
  newItemName,
  setNewItemName,
  newItemDescription,
  setNewItemDescription,
  newSpaceName,
  setNewSpaceName,
  newSpaceParentId,
  setNewSpaceParentId,
  spaces = [], // Default to an empty array
  handleAddItem,
  handleAddSpace,
}) => {
  return (
    <div className="form-container" style={{ display: "flex", gap: "20px" }}>
      {/* Add a New Item */}
      <div style={{ flex: "1" }}>
        <h3>Add a New Item</h3>
        <input
          type="text"
          placeholder="Item Name"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          style={{ width: "100%", marginBottom: "5px" }}
        />
        <textarea
          placeholder="Item Description"
          value={newItemDescription}
          onChange={(e) => setNewItemDescription(e.target.value)}
          style={{ width: "100%", marginBottom: "5px" }}
        />
        <button onClick={handleAddItem}>Add Item</button>
      </div>

      {/* Add a New Space */}
      <div style={{ flex: "1" }}>
        <h3>Add a New Space</h3>
        <input
          type="text"
          placeholder="Space Name"
          value={newSpaceName}
          onChange={(e) => setNewSpaceName(e.target.value)}
          style={{ width: "100%", marginBottom: "5px" }}
        />
        <select
          value={newSpaceParentId || ""}
          onChange={(e) => setNewSpaceParentId(e.target.value || null)}
          style={{ width: "100%", marginBottom: "5px" }}
        >
          <option value="">No Parent</option>
          {Array.isArray(spaces) && spaces.length > 0 ? (
            spaces.map((space) => (
              <option key={space.id} value={space.id}>
                {space.name}
              </option>
            ))
          ) : (
            <option disabled>No Spaces Available</option>
          )}
        </select>
        <button onClick={handleAddSpace}>Add Space</button>
      </div>
    </div>
  );
};

export default AddForm;

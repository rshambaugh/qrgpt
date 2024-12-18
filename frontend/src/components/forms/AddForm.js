import React from "react";
import { generateIndentedOptions } from "../../services/utils";

const AddForm = ({
  newItemName,
  setNewItemName,
  newItemDescription,
  setNewItemDescription,
  newItemSpaceId,
  setNewItemSpaceId,
  newSpaceName,
  setNewSpaceName,
  newSpaceParentId,
  setNewSpaceParentId,
  spaces,
  handleAddItem,
  handleAddSpace,
}) => {
  const indentedSpaces = generateIndentedOptions(spaces); // Use the utility function

  return (
    <div className="form-container" style={{ display: "flex", gap: "20px" }}>
      {/* Add New Item Form */}
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
        <select
          value={newItemSpaceId || ""}
          onChange={(e) => setNewItemSpaceId(e.target.value || null)}
          style={{ width: "100%", marginBottom: "10px" }}
        >
          <option value="">Unassigned</option>
          {indentedSpaces.map((space) => (
            <option key={space.id} value={space.id}>
              {space.name}
            </option>
          ))}
        </select>
        <button onClick={handleAddItem}>Add Item</button>
      </div>

      {/* Add New Space Form */}
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
          style={{ width: "100%", marginBottom: "10px" }}
        >
          <option value="">No Parent</option>
          {indentedSpaces.map((space) => (
            <option key={space.id} value={space.id}>
              {space.name}
            </option>
          ))}
        </select>
        <button onClick={handleAddSpace}>Add Space</button>
      </div>
    </div>
  );
};

export default AddForm;

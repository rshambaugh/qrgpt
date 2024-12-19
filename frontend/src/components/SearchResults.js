import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faSave } from "@fortawesome/free-solid-svg-icons";

const SearchResults = ({ searchResults, spaces, onEditItem, onDeleteItem }) => {
  const [editingItemId, setEditingItemId] = useState(null); // Track which item is being edited
  const [editedName, setEditedName] = useState(""); // Edited name for inline form
  const [editedDescription, setEditedDescription] = useState(""); // Edited description

  // Helper to generate breadcrumbs
  const generateBreadcrumbs = (spaceId) => {
    const breadcrumbs = [];
    let currentSpaceId = spaceId;

    while (currentSpaceId) {
      const space = spaces.find((s) => s.id === currentSpaceId);
      if (!space) break;

      breadcrumbs.unshift(space.name);
      currentSpaceId = space.parent_id;
    }

    return breadcrumbs.join(" > ");
  };

  // Handle save logic
  const handleSave = (id) => {
    onEditItem(id, { name: editedName, description: editedDescription });
    setEditingItemId(null); // Exit edit mode
    setEditedName("");
    setEditedDescription("");
  };

  return (
    <div className="search-results">
      <h3>Search Results</h3>
      <div className="search-results-cards">
        {searchResults.map((result) => (
          <div key={result.key} className="search-result-card">
            {/* Action Icons */}
            <div className="card-actions">
              {editingItemId === result.id ? (
                // Save icon for inline editing
                <FontAwesomeIcon
                  icon={faSave}
                  onClick={() => handleSave(result.id)}
                  className="save-icon"
                />
              ) : (
                <>
                  <FontAwesomeIcon
                    icon={faEdit}
                    onClick={() => {
                      setEditingItemId(result.id);
                      setEditedName(result.name);
                      setEditedDescription(result.description || "");
                    }}
                    className="edit-icon"
                  />
                  <FontAwesomeIcon
                    icon={faTrash}
                    onClick={() => onDeleteItem(result.id)}
                    className="delete-icon"
                  />
                </>
              )}
            </div>

            {/* Inline Edit Form */}
            {editingItemId === result.id ? (
              <div className="edit-form">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Item Name"
                />
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="Description"
                ></textarea>
              </div>
            ) : (
              // Regular display content
              <>
                <h4>{result.name}</h4>
                {result.description && (
                  <p className="result-description">{result.description}</p>
                )}
                {result.type === "item" && result.space_id && (
                  <p className="result-location">
                    Location: {generateBreadcrumbs(result.space_id)}
                  </p>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
export default SearchResults;

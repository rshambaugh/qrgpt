import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faSave } from "@fortawesome/free-solid-svg-icons";

const SearchResults = ({ searchResults, spaces, onEditItem, onDeleteItem, onEditSpace }) => {
  const [editingId, setEditingId] = useState(null); // Track which item/space is being edited
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
  const handleSave = (id, type) => {
    if (!editedName.trim()) {
      alert("Name cannot be empty.");
      return;
    }

    if (type === "item") {
      onEditItem(id, { name: editedName, description: editedDescription });
    } else if (type === "space") {
      onEditSpace(id, editedName);
    }

    setEditingId(null); // Exit edit mode
    setEditedName("");
    setEditedDescription("");
  };

  return (
    <div className="search-results">
      <h3>Search Results</h3>
      {searchResults.length > 0 ? (
        <div className="search-results-cards">
          {searchResults.map((result) => (
            <div
              key={`${result.type}-${result.id}`}
              className={`search-result-card ${
                result.type === "item" ? "item-card" : "space-card"
              }`}
            >
              {/* Action Icons */}
              <div className="card-actions">
                {editingId === result.id ? (
                  // Save icon for inline editing
                  <FontAwesomeIcon
                    icon={faSave}
                    onClick={() => handleSave(result.id, result.type)}
                    className="save-icon"
                  />
                ) : (
                  <>
                    <FontAwesomeIcon
                      icon={faEdit}
                      onClick={() => {
                        setEditingId(result.id);
                        setEditedName(result.name);
                        setEditedDescription(result.description || "");
                      }}
                      className="edit-icon"
                    />
                    <FontAwesomeIcon
                      icon={faTrash}
                      onClick={() =>
                        result.type === "item"
                          ? onDeleteItem(result.id)
                          : console.log("Delete space functionality here")
                      }
                      className="delete-icon"
                    />
                  </>
                )}
              </div>

              {/* Inline Edit Form */}
              {editingId === result.id ? (
                <div className="edit-form">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Name"
                  />
                  {result.type === "item" && (
                    <textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      placeholder="Description"
                    ></textarea>
                  )}
                </div>
              ) : (
                // Regular display content
                <>
                  <h4>{result.name}</h4>
                  {result.type === "item" && result.description && (
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
      ) : (
        <p>No results found. Please refine your search query.</p>
      )}
    </div>
  );
};

export default SearchResults;

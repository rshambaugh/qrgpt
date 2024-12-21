// Start SearchResults.js
import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faSave } from "@fortawesome/free-solid-svg-icons";

const generateBreadcrumbs = (spaces, spaceId) => {
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

const SearchResults = ({ searchResults, spaces, onEditItem, onDeleteItem, onEditSpace }) => {
  const [editingId, setEditingId] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [editedDescription, setEditedDescription] = useState("");

  const handleSave = (id, type) => {
    if (!editedName.trim()) {
      alert("Name cannot be empty.");
      return;
    }

    if (type === "item") {
      onEditItem(id, { name: editedName, description: editedDescription });
    } else if (type === "space") {
      // Use the passed-in onEditSpace prop
      onEditSpace(id, editedName);
    }

    setEditingId(null);
    setEditedName("");
    setEditedDescription("");
  };

  const handleDeleteSpace = async (spaceId) => {
    try {
      const response = await fetch(`http://localhost:8000/spaces/${spaceId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        // You may need to refetch spaces or update parent state to remove the deleted space from UI
        console.log(`Space with ID ${spaceId} deleted successfully.`);
      } else {
        const errorData = await response.json();
        console.error(`Error deleting space: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Error deleting space:", error);
    }
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
              <div className="card-actions">
                {editingId === result.id ? (
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
                      onClick={async () => {
                        if (result.type === "item") {
                          onDeleteItem(result.id);
                        } else {
                          await handleDeleteSpace(result.id);
                        }
                      }}
                      className="delete-icon"
                    />
                  </>
                )}
              </div>

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
                <>
                  <h4>{result.name}</h4>
                  {result.type === "item" && result.description && (
                    <p className="result-description">{result.description}</p>
                  )}
                  {result.type === "item" && result.space_id && (
                    <p className="result-location">
                      Location: {generateBreadcrumbs(spaces, result.space_id)}
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
// End SearchResults.js

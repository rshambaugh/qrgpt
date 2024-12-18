import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";

const SearchResults = ({ searchResults, spaces, onEditItem, onDeleteItem }) => {
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

  return (
    <div className="search-results">
      <h3>Search Results</h3>
      <div className="search-results-cards">
        {searchResults.map((result) => (
          <div key={result.id} className="search-result-card">
            {/* Action Icons */}
            <div className="card-actions">
              <FontAwesomeIcon
                icon={faEdit}
                onClick={() =>
                  result.space_id
                    ? onEditItem(result.id)
                    : console.log("Edit space", result.id)
                }
                className="edit-icon"
              />
              <FontAwesomeIcon
                icon={faTrash}
                onClick={() =>
                  result.space_id
                    ? onDeleteItem(result.id)
                    : console.log("Delete space", result.id)
                }
                className="delete-icon"
              />
            </div>

            {/* Card Content */}
            <h4>{result.name}</h4>
            {result.description && <p className="result-description">{result.description}</p>}
            {result.space_id && (
              <p className="result-location">
                Location: {generateBreadcrumbs(result.space_id)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;

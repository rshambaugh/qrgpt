import React from "react";

const SearchResults = ({ searchResults, spaces, onEditItem, onDeleteItem }) => {
  const generateBreadcrumbs = (spaceId) => {
    let breadcrumbs = [];
    let currentId = spaceId;

    while (currentId) {
      const space = spaces?.find((s) => s.id === currentId); // Add null check for spaces
      if (!space) break;

      breadcrumbs.unshift(space);
      currentId = space.parent_id;
    }

    return breadcrumbs;
  };

  return (
    <div className="search-results">
      <h3>Search Results</h3>
      <div className="search-results-cards">
        {searchResults.map((result) => (
          <div key={result.id} className="search-result-card">
            <h4>{result.name}</h4>
            {result.description && <p>{result.description}</p>}
            {result.space_id && (
              <p>
                Location:{" "}
                {generateBreadcrumbs(result.space_id).map((space, index, arr) => (
                  <span key={space.id}>
                    {space.name}
                    {index < arr.length - 1 && " > "}
                  </span>
                ))}
              </p>
            )}
            <div className="card-actions">
              <button onClick={() => onEditItem(result.id)}>Edit</button>
              <button onClick={() => onDeleteItem(result.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;

import React from "react";
import "../styles/SearchResults.css";

// Breadcrumb Component
const Breadcrumb = ({ id, name, onClick }) => (
  <>
    <button
      onClick={() => onClick(id)}
      style={{
        color: "blue",
        textDecoration: "underline",
        cursor: "pointer",
        marginRight: "5px",
        background: "none",
        border: "none",
        padding: 0,
        fontSize: "inherit",
      }}
    >
      {name}
    </button>
    <span style={{ marginRight: "5px" }}>{'>'}</span>
  </>
);

// Generate Breadcrumbs
const generateBreadcrumbs = (spaceId, spaces, onBreadcrumbClick) => {
  if (!spaceId) {
    console.warn("[generateBreadcrumbs] Invalid spaceId provided.");
    return null;
  }

  if (!Array.isArray(spaces)) {
    console.warn("[generateBreadcrumbs] spaces is not an array or is undefined.");
    return null;
  }

  const breadcrumbs = [];
  let currentId = spaceId;

  const visitedSpaces = new Set();

  while (currentId && !visitedSpaces.has(currentId)) {
    visitedSpaces.add(currentId);
    const currentSpace = spaces.find((space) => space.id === currentId);
    if (!currentSpace) break;

    // Add breadcrumb
    breadcrumbs.unshift({
      id: currentSpace.id,
      name: currentSpace.name,
    });

    // Move to parent space
    currentId = currentSpace.parent_id;
  }

  return breadcrumbs.map((crumb) => (
    <React.Fragment key={crumb.id}>
      <Breadcrumb id={crumb.id} name={crumb.name} onClick={() => onBreadcrumbClick(crumb.id)} />
    </React.Fragment>
  ));
};

// Main SearchResults Component
const SearchResults = ({ searchResults, spaces = [], onBreadcrumbClick }) => {

  if (!searchResults || searchResults.length === 0) {
    return <p className="search-no-results">No results found. Please refine your search query.</p>;
  }

  return (
    <div className="search-results-container">
      {searchResults.map((result, index) => {
        const spaceExists = result.type === "item" && result.space_id && spaces.some(space => space.id === result.space_id);

        return (
          <div key={index} className="search-result-card">
            <h4 className="search-result-title">
              {result.type === "space" ? "Space: " : "Item: "}
              {result.name}
            </h4>
            {result.description && (
              <p className="search-result-description">{result.description}</p>
            )}
            {spaceExists ? (
              <div className="search-result-breadcrumbs">
                {generateBreadcrumbs(result.space_id, spaces, onBreadcrumbClick)}
              </div>
            ) : (
              <div className="search-result-breadcrumbs">
                <em>Location unavailable</em>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SearchResults;


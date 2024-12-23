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

const generateBreadcrumbs = (spaceId, spaces, onBreadcrumbClick) => {
  if (!spaceId) return null;
  if (!Array.isArray(spaces)) return null;

  const breadcrumbs = [];
  let currentId = spaceId;
  const visited = new Set();

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    const currentSpace = spaces.find((s) => s.id === currentId);
    if (!currentSpace) break;

    breadcrumbs.unshift({
      id: currentSpace.id,
      name: currentSpace.name,
    });
    currentId = currentSpace.parent_id;
  }

  return breadcrumbs.map((crumb) => (
    <React.Fragment key={crumb.id}>
      <Breadcrumb id={crumb.id} name={crumb.name} onClick={onBreadcrumbClick} />
    </React.Fragment>
  ));
};

const SearchResults = ({ searchResults, spaces = [], onBreadcrumbClick }) => {
  console.log("[SearchResults] Received Props:", { searchResults, spaces });

  if (!searchResults || searchResults.length === 0) {
    console.warn("[SearchResults] No results found or empty array.");
    return <p className="search-no-results">No results found. Please refine your search query.</p>;
  }

  return (
    <div className="search-results-container">
      {searchResults.map((result, index) => {
        console.log(`[SearchResults] Processing result at index ${index}:`, result);
        console.log("[SearchResults] Validating breadcrumbs for space_id:", result.space_id);
        const spaceExists =
          result.type === "item" &&
          result.space_id &&
          spaces.some((space) => space.id === result.space_id);

        // If it's a space itself, we can show a breadcrumb from that space up
        let breadcrumbs = null;
        if (result.type === "space") {
          breadcrumbs = generateBreadcrumbs(result.id, spaces, onBreadcrumbClick);
        } else if (spaceExists) {
          breadcrumbs = generateBreadcrumbs(result.space_id, spaces, onBreadcrumbClick);
        }

        return (
          <div key={index} className="search-result-card">
            <h4 className="search-result-title">
              {result.type === "space" ? "Space: " : "Item: "}
              {result.name}
            </h4>
            {result.description && (
              <p className="search-result-description">{result.description}</p>
            )}
            {breadcrumbs ? (
              <div className="search-result-breadcrumbs">
                {breadcrumbs}
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

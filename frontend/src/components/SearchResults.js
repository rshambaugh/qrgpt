import React from "react";
import "../styles/SearchResults.css"; // Ensure there's a CSS file for styling

const SearchResults = ({ searchResults }) => {
  console.log("[SearchResults] Received Props:", searchResults); // ✅ Log search results

  if (!searchResults || searchResults.length === 0) {
    return <p className="search-no-results">No results found. Please refine your search query.</p>;
  }

  return (
    <div className="search-results-container">
      {searchResults.map((result, index) => (
        <div key={index} className="search-result-card">
          <h4 className="search-result-title">
            {result.type === "space" ? "Space: " : "Item: "}
            {result.name}
          </h4>
          {result.description && (
            <p className="search-result-description">{result.description}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default SearchResults;

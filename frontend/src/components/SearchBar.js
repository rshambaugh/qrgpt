import React from "react";

const SearchBar = ({ searchQuery, onSearch }) => {

  const handleChange = (e) => {
    const value = e.target.value;
    onSearch(value);
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search for spaces or items..."
        value={searchQuery}
        onChange={handleChange} // Ensure onSearch updates the state
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px",
          fontSize: "1rem",
          border: "1px solid #ddd",
          borderRadius: "4px",
        }}
      />
    </div>
  );
};

export default SearchBar;

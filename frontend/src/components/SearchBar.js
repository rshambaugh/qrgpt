import React from "react";

const SearchBar = ({ searchTerm, setSearchTerm }) => {
  return (
    <div style={{ marginBottom: "20px" }}>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search for spaces or items..."
        style={{ padding: "10px", width: "100%" }}
      />
    </div>
  );
};

export default SearchBar;

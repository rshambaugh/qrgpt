import React, { useState, useEffect } from "react";
import NestedSpaces from "./components/NestedSpaces";
import AddForm from "./components/forms/AddForm";
import SearchBar from "./components/SearchBar";
import SearchResults from "./components/SearchResults";

const App = () => {
  const [spaces, setSpaces] = useState([]);
  const [items, setItems] = useState([]);
  const [currentSpaceId, setCurrentSpaceId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemSpaceId, setNewItemSpaceId] = useState(null);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceParentId, setNewSpaceParentId] = useState(null);

  useEffect(() => {
    fetchSpaces();
    fetchItems();
  }, []);

  useEffect(() => {
    console.log("App mounted. Spaces:", spaces, "Items:", items);
  }, [spaces, items]);
  

  // Fetch spaces
  const fetchSpaces = async () => {
    try {
      const response = await fetch("http://localhost:8000/spaces-recursive");
      const data = await response.json();
      setSpaces(data.spaces);
    } catch (error) {
      console.error("Error fetching spaces:", error);
    }
  };

  // Fetch items
  const fetchItems = async () => {
    try {
      const response = await fetch("http://localhost:8000/items/");
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  // Generate breadcrumb trail
  const generateBreadcrumbs = (spaceId) => {
    const breadcrumbs = [];
    let currentId = spaceId;

    while (currentId) {
      const space = spaces.find((s) => s.id === currentId);
      if (!space) break;

      breadcrumbs.unshift(space);
      currentId = space.parent_id;
    }
    return breadcrumbs;
  };

  // Handle breadcrumb click
  const handleBreadcrumbClick = (spaceId) => {
    setCurrentSpaceId(spaceId);
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Spaces and Items</h1>

      {/* Search Bar */}
      <SearchBar searchQuery={searchQuery} onSearch={setSearchQuery} />

      {/* Search Results */}
      <SearchResults
        searchResults={searchResults}
        spaces={spaces}
        onEditItem={(id, updates) => {
          console.log("Edit item:", id, updates);
        }}
        onDeleteItem={(id) => console.log("Delete item:", id)}
      />

      {/* Add Form */}
      <AddForm
        newItemName={newItemName}
        setNewItemName={setNewItemName}
        newItemDescription={newItemDescription}
        setNewItemDescription={setNewItemDescription}
        newItemSpaceId={newItemSpaceId}
        setNewItemSpaceId={setNewItemSpaceId}
        newSpaceName={newSpaceName}
        setNewSpaceName={setNewSpaceName}
        newSpaceParentId={newSpaceParentId}
        setNewSpaceParentId={setNewSpaceParentId}
        spaces={spaces}
        handleAddItem={() => console.log("Add item")}
        handleAddSpace={() => console.log("Add space")}
      />

      {/* Content Layout */}
      <div className="content-container">
        {/* Left Column */}
        <div className="nested-spaces-column">
          <h2>Spaces</h2>
          <NestedSpaces
            spaces={spaces}
            handleSpaceClick={(spaceId) => setCurrentSpaceId(spaceId)}
            onEditSpace={() => {}}
            onDeleteSpace={() => {}}
          />
        </div>

        {/* Right Column */}
        <div className="items-column">
          {currentSpaceId ? (
            <>
              {/* Breadcrumb Trail */}
              <div className="breadcrumb">
                {generateBreadcrumbs(currentSpaceId).map((space, index, array) => (
                  <span key={space.id}>
                    <a
                      href="#"
                      onClick={() => handleBreadcrumbClick(space.id)}
                      style={{ textDecoration: "underline", cursor: "pointer" }}
                    >
                      {space.name}
                    </a>
                    {index < array.length - 1 && " > "}
                  </span>
                ))}
              </div>

              {/* Current Space Content */}
              {items
                .filter((item) => item.space_id === currentSpaceId)
                .map((item) => (
                  <div key={item.id} className="item-card">
                    {item.name}
                  </div>
                ))}
            </>
          ) : (
            <p>Select a space to view its contents.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;

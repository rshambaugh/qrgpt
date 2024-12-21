import React, { useState, useEffect, useCallback } from "react";
import NestedSpaces from "./components/NestedSpaces";
import AddForm from "./components/forms/AddForm";
import SearchBar from "./components/SearchBar";
import SearchResults from "./components/SearchResults";
import ContentArea from "./components/ContentArea";

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

  // Fetch Spaces
  const fetchSpaces = async () => {
    try {
      const response = await fetch("http://localhost:8000/spaces/recursive");
      if (!response.ok) throw new Error("Failed to fetch spaces");
      const data = await response.json();
      setSpaces(data);
    } catch (error) {
      console.error("Error fetching spaces:", error);
    }
  };

  // Fetch Items
  const fetchItems = async () => {
    try {
      const response = await fetch("http://localhost:8000/items/");
      if (!response.ok) throw new Error("Failed to fetch items");
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  useEffect(() => {
    fetchSpaces();
    fetchItems();
  }, []);

  // Add Space
  const addSpace = async (name, parent_id) => {
    try {
      const response = await fetch("http://localhost:8000/spaces/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parent_id }),
      });
      if (response.ok) fetchSpaces();
    } catch (error) {
      console.error("Error adding space:", error);
    }
  };

  // Add Item
  const addItem = async (name, description, space_id) => {
    try {
      const response = await fetch("http://localhost:8000/items/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, space_id }),
      });
      if (response.ok) fetchItems();
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  // Handle Search
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const filteredSpaces = spaces.filter((space) =>
      space.name.toLowerCase().includes(query.toLowerCase())
    );
    const filteredItems = items.filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );

    setSearchResults([
      ...filteredSpaces.map((space) => ({ ...space, type: "space" })),
      ...filteredItems.map((item) => ({ ...item, type: "item" })),
    ]);
  };

  const handleSpaceClick = (spaceId) => {
    setCurrentSpaceId(spaceId);
  };

  return (
    <div className="app-container">
      <h1 className="app-title">QRganizer</h1>

      <SearchBar searchQuery={searchQuery} onSearch={handleSearch} />

      <SearchResults
        searchResults={searchResults}
        spaces={spaces}
        onEditSpace={() => {}}
        onDeleteSpace={() => {}}
        onEditItem={() => {}}
        onDeleteItem={() => {}}
      />

      <AddForm
        addSpace={addSpace}
        addItem={addItem}
        spaces={spaces}
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
      />

      <div className="content-container">
        <NestedSpaces
          spaces={spaces}
          setSpaces={setSpaces}
          currentParentId={null}
          handleSpaceClick={handleSpaceClick}
        />

        <ContentArea
          currentSpaceId={currentSpaceId}
          spaces={spaces}
          items={items}
        />
      </div>
    </div>
  );
};

export default App;

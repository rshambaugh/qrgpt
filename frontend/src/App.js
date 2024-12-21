import React, { useState, useEffect } from "react";
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
    console.log("[fetchSpaces] Fetching spaces...");
    try {
      const response = await fetch("http://localhost:8000/spaces/recursive");
      if (!response.ok) throw new Error("Failed to fetch spaces");
      const data = await response.json();
      setSpaces(data);
      console.log("[fetchSpaces] Spaces fetched successfully:", data);
    } catch (error) {
      console.error("[fetchSpaces] Error fetching spaces:", error);
    }
  };

  // Fetch Items
  const fetchItems = async () => {
    console.log("[fetchItems] Fetching items...");
    try {
      const response = await fetch("http://localhost:8000/items/");
      if (!response.ok) throw new Error("Failed to fetch items");
      const data = await response.json();
      setItems(data);
      console.log("[fetchItems] Items fetched successfully:", data);
    } catch (error) {
      console.error("[fetchItems] Error fetching items:", error);
    }
  };

  useEffect(() => {
    console.log("[useEffect] Initial fetch of spaces and items");
    fetchSpaces();
    fetchItems();
  }, []);

  // Add Space
  const addSpace = async (name, parent_id) => {
    console.log("[addSpace] Adding space:", { name, parent_id });
    try {
      const response = await fetch("http://localhost:8000/spaces/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parent_id }),
      });
      if (response.ok) {
        console.log("[addSpace] Space added successfully.");
        fetchSpaces();
      }
    } catch (error) {
      console.error("[addSpace] Error adding space:", error);
    }
  };

  // Add Item
  const addItem = async (name, description, space_id) => {
    console.log("[addItem] Adding item:", { name, description, space_id });
    try {
      const response = await fetch("http://localhost:8000/items/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, space_id }),
      });
      if (response.ok) {
        console.log("[addItem] Item added successfully.");
        fetchItems();
      }
    } catch (error) {
      console.error("[addItem] Error adding item:", error);
    }
  };

  // Handle Search
  const handleSearch = (query) => {
    console.log("[handleSearch] Query:", query);
    setSearchQuery(query);
    if (!query.trim()) {
      console.log("[handleSearch] Search cleared.");
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

    console.log("[handleSearch] Search Results:", searchResults);
  };

  // Handle Space Click
  const handleSpaceClick = (spaceId) => {
    console.log("[App.js] handleSpaceClick called with spaceId:", spaceId);
    setCurrentSpaceId(spaceId);
    console.log("[App.js] currentSpaceId updated to:", spaceId);
  };
  

  console.log("[App Render] State Snapshot:", {
    currentSpaceId,
    spaces,
    items,
    searchQuery,
    searchResults,
    newItemName,
    newItemDescription,
    newItemSpaceId,
    newSpaceName,
    newSpaceParentId,
  });

  return (
    <div className="app-container">
      <h1 className="app-title">QRganizer</h1>

      <SearchBar searchQuery={searchQuery} onSearch={handleSearch} />

      <SearchResults
        searchResults={searchResults}
        spaces={spaces}
        onEditSpace={() => console.log("[SearchResults] Edit Space clicked")}
        onDeleteSpace={() => console.log("[SearchResults] Delete Space clicked")}
        onEditItem={() => console.log("[SearchResults] Edit Item clicked")}
        onDeleteItem={() => console.log("[SearchResults] Delete Item clicked")}
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

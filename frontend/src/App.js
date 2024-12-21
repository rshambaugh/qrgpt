import React, { useState, useEffect } from "react";
import NestedSpaces from "./components/NestedSpaces";
import AddForm from "./components/forms/AddForm";
import SearchBar from "./components/SearchBar";
import SearchResults from "./components/SearchResults";
import ContentArea from "./components/ContentArea";
import "./styles/Styles.css";

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

  // Edit Space
  const handleEditSpace = (spaceId, newName) => {
    console.log("[App.js] handleEditSpace called with:", { spaceId, newName });
    try {
      fetch(`http://localhost:8000/spaces/${spaceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      }).then((response) => {
        if (!response.ok) {
          throw new Error("Failed to edit space");
        }
        console.log("[App.js] Space updated successfully");
        fetchSpaces();
      });
    } catch (error) {
      console.error("[App.js] Error updating space:", error);
    }
  };

  // Handle Space Click
  const handleSpaceClick = (spaceId) => {
    console.log("[App.js] handleSpaceClick called with spaceId:", spaceId);
    setCurrentSpaceId(spaceId);
  };

  return (
    <div className="app-container">
      <h1 className="app-title">QRganizer</h1>
      <SearchBar searchQuery={searchQuery} onSearch={setSearchQuery} />
      <SearchResults searchResults={searchResults} />
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
        fetchSpaces={fetchSpaces}
        fetchItems={fetchItems}
      />
      <div className="content-container">
        <NestedSpaces spaces={spaces} onEditSpace={handleEditSpace} />
        <ContentArea currentSpaceId={currentSpaceId} spaces={spaces} items={items} />
      </div>
    </div>
  );
};

export default App;

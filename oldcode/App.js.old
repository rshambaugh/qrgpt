import React, { useState, useEffect } from "react";
import NestedSpaces from "./components/NestedSpaces";
import AddForm from "./components/forms/AddForm";
import SearchBar from "./components/SearchBar";
import SearchResults from "./components/SearchResults";

const App = () => {
  const [spaces, setSpaces] = useState([]); // Spaces data
  const [items, setItems] = useState([]);   // Items data
  const [currentSpaceId, setCurrentSpaceId] = useState(null); // Selected space ID
  const [searchQuery, setSearchQuery] = useState(""); // Search query state
  const [searchResults, setSearchResults] = useState([]); // Search results
  const [newItemName, setNewItemName] = useState(""); // New item name
  const [newItemDescription, setNewItemDescription] = useState(""); // New item description
  const [newItemSpaceId, setNewItemSpaceId] = useState(null); // Space for new item
  const [newSpaceName, setNewSpaceName] = useState(""); // New space name
  const [newSpaceParentId, setNewSpaceParentId] = useState(null); // Parent space ID for new space

  // Fetch all spaces
  const fetchSpaces = async () => {
    try {
      const response = await fetch("http://localhost:8000/spaces-recursive");
      if (!response.ok) throw new Error("Failed to fetch spaces");
      const data = await response.json();
      setSpaces(data.spaces);
    } catch (error) {
      console.error("Error fetching spaces:", error);
    }
  };

  // Fetch all items
  const fetchItems = async () => {
    try {
      const response = await fetch("http://localhost:8000/items/");
      if (!response.ok) throw new Error("Failed to fetch items.");
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchSpaces();
    fetchItems();
  }, []);

  // Edit item handler
  // Updated edit handlers
  // Edit item handler
const onEditItem = async (itemId, updatedFields) => {
  try {
    const response = await fetch(`http://localhost:8000/items/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedFields),
    });

    if (response.ok) {
      fetchItems(); // Fetch updated list of items

      // Refresh search results based on the current query
      if (searchQuery) {
        const updatedItems = items.map((item) =>
          item.id === itemId ? { ...item, ...updatedFields } : item
        );
        const filteredItems = updatedItems.filter((item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const filteredSpaces = spaces.filter((space) =>
          space.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        setSearchResults([
          ...filteredSpaces.map((space) => ({ ...space, type: "space", key: `space-${space.id}` })),
          ...filteredItems.map((item) => ({ ...item, type: "item", key: `item-${item.id}` })),
        ]);
      }
    } else {
      throw new Error("Failed to update item.");
    }
  } catch (error) {
    console.error("Error updating item:", error);
  }
};


  

  // Delete item handler
  const onDeleteItem = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await fetch(`http://localhost:8000/items/${itemId}`, {
          method: "DELETE",
        });
        fetchItems();
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    }
  };

  // Edit space handler
  const onEditSpace = async (spaceId, newName) => {
    try {
      await fetch(`http://localhost:8000/spaces/${spaceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      fetchSpaces();
    } catch (error) {
      console.error("Error editing space:", error);
    }
  };

  // Delete space handler
  const onDeleteSpace = async (spaceId) => {
    if (window.confirm("Are you sure you want to delete this space?")) {
      try {
        await fetch(`http://localhost:8000/spaces/${spaceId}`, {
          method: "DELETE",
        });
        fetchSpaces();
        fetchItems(); // Refresh items in case they belonged to the deleted space
      } catch (error) {
        console.error("Error deleting space:", error);
      }
    }
  };

  // Handle search logic
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

    setSearchResults([...filteredSpaces, ...filteredItems]);
  };

  // Add new item
  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      alert("Item name cannot be empty.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/items/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newItemName,
          description: newItemDescription,
          space_id: newItemSpaceId,
        }),
      });

      if (response.ok) {
        setNewItemName("");
        setNewItemDescription("");
        setNewItemSpaceId(null);
        fetchItems();
      } else {
        throw new Error("Failed to add item.");
      }
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  // Add new space
  const handleAddSpace = async () => {
    if (!newSpaceName.trim()) {
      alert("Space name cannot be empty.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/spaces/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSpaceName,
          parent_id: newSpaceParentId,
        }),
      });

      if (response.ok) {
        setNewSpaceName("");
        setNewSpaceParentId(null);
        fetchSpaces();
      } else {
        throw new Error("Failed to add space.");
      }
    } catch (error) {
      console.error("Error adding space:", error);
    }
  };

  // Generate breadcrumb trail for a space
  const generateBreadcrumbs = (spaceId) => {
    let breadcrumbs = [];
    let currentId = spaceId;

    while (currentId) {
      const space = spaces.find((s) => s.id === currentId);
      if (!space) break;

      breadcrumbs.unshift(space);
      currentId = space.parent_id;
    }

    return breadcrumbs;
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Spaces and Items</h1>

      {/* Search Bar */}
      <SearchBar
        searchQuery={searchQuery}
        onSearch={handleSearch}
      />

      {/* Search Results */}
      <SearchResults
        searchResults={searchResults}
        spaces={spaces}
        onEditItem={onEditItem}
        onDeleteItem={onDeleteItem}
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
        handleAddItem={handleAddItem}
        handleAddSpace={handleAddSpace}
      />

      {/* Content Layout */}
      <div className="content-container">
        {/* Left Column: Spaces */}
        <div className="nested-spaces-column">
          <h2>Spaces</h2>
          <NestedSpaces
            spaces={spaces}
            handleSpaceClick={setCurrentSpaceId}
            onEditSpace={onEditSpace}
            onDeleteSpace={onDeleteSpace}
          />
        </div>

        {/* Right Column: Current Space */}
        <div className="items-column">
          {currentSpaceId ? (
            <>
              {spaces
                .filter((space) => space.parent_id === currentSpaceId)
                .map((space) => (
                  <div
                    key={space.id}
                    className="space-card"
                    style={{
                      borderBottom: `3px solid ${space.color || "#ccc"}`,
                    }}
                  >
                    {space.name}
                  </div>
                ))}
              {items
                .filter((item) => item.space_id === currentSpaceId)
                .map((item) => (
                  <div
                    key={item.id}
                    className="item-card"
                    style={{
                      backgroundColor: "#f8f8f8",
                      borderBottom: `3px solid ${spaces.find(
                        (space) => space.id === item.space_id
                      )?.color || "#ccc"}`,
                    }}
                  >
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

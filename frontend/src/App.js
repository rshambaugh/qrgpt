import React, { useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import ParentContainer from "./components/ParentContainer";
import ItemList from "./components/ItemList";

const App = () => {
  const [spaces, setSpaces] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fields for new item/space creation
  const [newItemName, setNewItemName] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceParentId, setNewSpaceParentId] = useState(null);

  // Navigation state
  // "list" = top-level view of spaces, "detail" = viewing a particular space subtree
  const [viewMode, setViewMode] = useState("list");
  const [currentSpaceId, setCurrentSpaceId] = useState(null);

  const fetchSpacesAndItems = async () => {
    try {
      setLoading(true);
      const responseSpaces = await fetch("http://localhost:8000/spaces-recursive/");
      const responseItems = await fetch("http://localhost:8000/items/");

      if (!responseSpaces.ok) throw new Error(`Spaces fetch failed: ${responseSpaces.statusText}`);
      if (!responseItems.ok) throw new Error(`Items fetch failed: ${responseItems.statusText}`);

      const spacesData = await responseSpaces.json();
      const itemsData = await responseItems.json();

      console.log("Fetched spaces:", spacesData.spaces);
      console.log("Fetched items:", itemsData);

      setSpaces(spacesData.spaces || []);
      setItems(itemsData || []);
      console.log("Updated spaces after fetch:", spacesData.spaces);
    } catch (error) {
      console.error("Error fetching spaces and items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpacesAndItems();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      alert("Item name cannot be empty!");
      return;
    }

    try {
      await fetch("http://localhost:8000/items/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newItemName,
          description: newItemDescription,
          space_id: null,
        }),
      });

      setNewItemName("");
      setNewItemDescription("");
      fetchSpacesAndItems();
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const handleAddSpace = async () => {
    if (!newSpaceName.trim()) {
      alert("Space name cannot be empty!");
      return;
    }

    try {
      await fetch("http://localhost:8000/spaces/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSpaceName,
          parent_id: newSpaceParentId,
        }),
      });

      setNewSpaceName("");
      setNewSpaceParentId(null);
      fetchSpacesAndItems();
    } catch (error) {
      console.error("Error adding space:", error);
    }
  };

  const handleDrop = async (draggedItemId, targetSpaceId, type) => {
    console.log("Handling drop:", { draggedItemId, targetSpaceId, type });
  
    let url = "";
    let body = {};
  
    if (type === "item") {
      url = `http://localhost:8000/items/${draggedItemId}/space`;
      body = { new_space_id: targetSpaceId ?? null };
    } else if (type === "space") {
      url = `http://localhost:8000/spaces/${draggedItemId}/parent`;
      body = { new_parent_id: targetSpaceId ?? null };
    } else {
      return; // Unknown type
    }
  
    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
  
      if (!response.ok) throw new Error("Failed to update");
  
      const data = await response.json();
      console.log("Drop successful:", data);
      fetchSpacesAndItems();
    } catch (error) {
      console.error("Error during drop:", error);
    }
  };

  const handleSpaceClick = (spaceId) => {
    setCurrentSpaceId(spaceId);
    setViewMode("detail");
  };

  const handleBack = () => {
    if (!currentSpaceId) {
      // Already at top level
      return;
    }

    const currentSpace = spaces.find((s) => s.id === currentSpaceId);
    if (currentSpace && currentSpace.parent_id) {
      setCurrentSpaceId(currentSpace.parent_id);
    } else {
      setCurrentSpaceId(null);
      setViewMode("list");
    }
  };

  // Deletion handlers
  const handleDeleteItem = async (itemId) => {
    try {
      const response = await fetch(`http://localhost:8000/items/${itemId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete item");
      fetchSpacesAndItems();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleDeleteSpace = async (spaceId) => {
    try {
      const response = await fetch(`http://localhost:8000/spaces/${spaceId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete space");
      fetchSpacesAndItems();
    } catch (error) {
      console.error("Error deleting space:", error);
    }
  };

  // Determine what to display based on viewMode/currentSpaceId
  let displayedSpaces = [];
  let displayedItems = [];

  if (viewMode === "list") {
    // Top-level view: show all spaces with parent_id = null, and unassigned items
    displayedSpaces = spaces.filter((s) => s.parent_id === null);
    displayedItems = items.filter((item) => item.space_id === null);
  } else {
    // Detail view: show the subtree for currentSpaceId
    const currentSpace = spaces.find((s) => s.id === currentSpaceId);
    if (currentSpace) {
      // All spaces in the subtree are already fetched. For simplicity, show current space and children
      // Adjust logic as desired to show full subtree
      displayedSpaces = spaces.filter((s) => s.id === currentSpace.id || s.parent_id === currentSpace.id);
      displayedItems = items.filter((item) => item.space_id === currentSpaceId);
    }
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app-container">
        <h1 className="app-title">Spaces and Items</h1>

        <div className="form-container">
          <h3>Add a New Item</h3>
          <input
            type="text"
            placeholder="Item Name"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
          />
          <textarea
            placeholder="Item Description"
            value={newItemDescription}
            onChange={(e) => setNewItemDescription(e.target.value)}
          />
          <button onClick={handleAddItem}>Add Item</button>
        </div>

        <div className="form-container">
          <h3>Add a New Space</h3>
          <input
            type="text"
            placeholder="Space Name"
            value={newSpaceName}
            onChange={(e) => setNewSpaceName(e.target.value)}
          />
          <select
            value={newSpaceParentId || ""}
            onChange={(e) => setNewSpaceParentId(e.target.value || null)}
          >
            <option value="">No Parent</option>
            {spaces.map((space) => (
              <option key={space.id} value={space.id}>
                {space.name}
              </option>
            ))}
          </select>
          <button onClick={handleAddSpace}>Add Space</button>
        </div>

        {viewMode === "detail" && (
          <button onClick={handleBack}>Back</button>
        )}

        <div className="content-container">
          <ParentContainer
            spaces={displayedSpaces}
            items={displayedItems}
            onDrop={handleDrop}
            onSpaceClick={handleSpaceClick}
            currentSpaceId={currentSpaceId}
            viewMode={viewMode}
            onDeleteItem={handleDeleteItem}
            onDeleteSpace={handleDeleteSpace}
          />

          {/* Always show unassigned items */}
          <ItemList
            items={items.filter((item) => item.space_id === null)}
            onDrop={(id, spaceId) => handleDrop(id, spaceId, "item")}
          />
        </div>
      </div>
    </DndProvider>
  );
};

export default App;

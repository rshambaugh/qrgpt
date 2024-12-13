import React, { useState, useEffect, useCallback } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import ParentContainer from "./components/ParentContainer";
import ItemList from "./components/ItemList";
import SearchBar from "./components/SearchBar";

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
  const [viewMode, setViewMode] = useState("list");
  const [currentSpaceId, setCurrentSpaceId] = useState(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

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

  const lowerTerm = searchTerm.toLowerCase();
  const filteredSpaces = spaces.filter((s) => s.name.toLowerCase().includes(lowerTerm));
  const filteredItems = items.filter(
    (i) =>
      i.name.toLowerCase().includes(lowerTerm) ||
      (i.description && i.description.toLowerCase().includes(lowerTerm))
  );

  let displayedSpaces = [];
  let displayedItems = [];

  if (viewMode === "list") {
    displayedSpaces = filteredSpaces.filter((s) => s.parent_id === null);
    displayedItems = filteredItems.filter((item) => item.space_id === null);
  } else {
    const currentSpace = spaces.find((s) => s.id === currentSpaceId);
    if (currentSpace) {
      displayedSpaces = filteredSpaces.filter(
        (s) => s.id === currentSpace.id || s.parent_id === currentSpace.id
      );
      displayedItems = filteredItems.filter((item) => item.space_id === currentSpaceId);
    }
  }

  // Confirm and delete item
  const handleDeleteItem = async (itemId) => {
    const confirmed = window.confirm("Are you sure you want to delete this item?");
    if (!confirmed) return;
    try {
      const response = await fetch(`http://localhost:8000/items/${itemId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete item");
      fetchSpacesAndItems();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  // Confirm and delete space
  const handleDeleteSpace = async (spaceId) => {
    const confirmed = window.confirm(
      "Deleting this space will delete all nested spaces and items. Are you sure?"
    );
    if (!confirmed) return;
    try {
      const response = await fetch(`http://localhost:8000/spaces/${spaceId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete space");
      fetchSpacesAndItems();
    } catch (error) {
      console.error("Error deleting space:", error);
    }
  };

  // Edit item (inline)
  const handleEditItem = async (itemId, newName, newDesc) => {
    try {
      const response = await fetch(`http://localhost:8000/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDesc }),
      });
      if (!response.ok) throw new Error("Failed to edit item");
      fetchSpacesAndItems();
    } catch (error) {
      console.error("Error editing item:", error);
    }
  };

  // Edit space (inline)
  const handleEditSpace = async (spaceId, newName) => {
    try {
      const response = await fetch(`http://localhost:8000/spaces/${spaceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (!response.ok) throw new Error("Failed to edit space");
      fetchSpacesAndItems();
    } catch (error) {
      console.error("Error editing space:", error);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app-container" style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "20px" }}>
        <h1 className="app-title">Spaces and Items</h1>

        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

        <div className="form-container" style={{ display: "flex", gap: "20px" }}>
          <div style={{ flex: "1" }}>
            <h3>Add a New Item</h3>
            <input
              type="text"
              placeholder="Item Name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              style={{ width: "100%", marginBottom: "5px" }}
            />
            <textarea
              placeholder="Item Description"
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
              style={{ width: "100%", marginBottom: "5px" }}
            />
            <button onClick={handleAddItem}>Add Item</button>
          </div>

          <div style={{ flex: "1" }}>
            <h3>Add a New Space</h3>
            <input
              type="text"
              placeholder="Space Name"
              value={newSpaceName}
              onChange={(e) => setNewSpaceName(e.target.value)}
              style={{ width: "100%", marginBottom: "5px" }}
            />
            <select
              value={newSpaceParentId || ""}
              onChange={(e) => setNewSpaceParentId(e.target.value || null)}
              style={{ width: "100%", marginBottom: "5px" }}
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
        </div>

        {viewMode === "detail" && (
          <button onClick={handleBack} style={{ alignSelf: "flex-start" }}>
            Back
          </button>
        )}

        <div className="content-container" style={{ display: "flex", gap: "20px" }}>
          <ParentContainer
            spaces={displayedSpaces}
            items={displayedItems}
            onDrop={handleDrop}
            onSpaceClick={handleSpaceClick}
            currentSpaceId={currentSpaceId}
            viewMode={viewMode}
            onDeleteSpace={handleDeleteSpace}
            onEditSpace={handleEditSpace}
          />

          <ItemList
            items={filteredItems}
            onDrop={(id, spaceId) => handleDrop(id, spaceId, "item")}
            currentSpaceId={currentSpaceId}
            onDeleteItem={handleDeleteItem}
            onEditItem={handleEditItem}
          />
        </div>
      </div>
    </DndProvider>
  );
};

export default App;

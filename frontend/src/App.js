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

  // Fields for creating items/spaces
  const [newItemName, setNewItemName] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceParentId, setNewSpaceParentId] = useState(null);

  // Navigation state
  const [viewMode, setViewMode] = useState("list"); // "list" or "detail"
  const [currentSpaceId, setCurrentSpaceId] = useState(null);

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
    return <div style={{ textAlign: "center", padding: "20px" }}>Loading...</div>;
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

  // Define handleSpaceHover here at top-level
  const handleSpaceHover = useCallback((spaceId) => {
    // If dragging an item and hovering over a space, navigate into it
    if (spaceId !== currentSpaceId) {
      setCurrentSpaceId(spaceId);
      setViewMode("detail");
    }
  }, [currentSpaceId]);

  const handleBack = () => {
    if (!currentSpaceId) {
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

  // Filtering logic based on search term
  const lowerSearch = searchTerm.toLowerCase();
  const filteredSpaces = spaces.filter(
    (space) => space.name.toLowerCase().includes(lowerSearch)
  );

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(lowerSearch) ||
      (item.description && item.description.toLowerCase().includes(lowerSearch))
  );

  let displayedSpaces = [];
  let displayedItems = [];

  if (viewMode === "list") {
    displayedSpaces = filteredSpaces.filter((s) => s.parent_id === null);
    displayedItems = filteredItems.filter((item) => item.space_id === null);
  } else {
    const currentSpace = spaces.find((s) => s.id === currentSpaceId);
    if (currentSpace) {
      const subtreeSpaces = [currentSpace, ...spaces.filter((s) => s.parent_id === currentSpace.id)];
      displayedSpaces = subtreeSpaces.filter((s) => filteredSpaces.some((fs) => fs.id === s.id));
      displayedItems = filteredItems.filter((item) => item.space_id === currentSpaceId);
    }
  }

  const confirmDeletion = (message) => {
    return window.confirm(message);
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirmDeletion("Are you sure you want to delete this item?")) return;

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

  const handleEditItem = (itemId) => {
    alert("Editing items is not implemented yet.");
  };

  const handleDeleteSpace = async (spaceId) => {
    if (!confirmDeletion("Are you sure you want to delete this space and all its items?")) return;

    try {
      const response = await fetch(`http://localhost:8000/spaces/${spaceId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete space");
      if (currentSpaceId === spaceId) {
        setCurrentSpaceId(null);
        setViewMode("list");
      }
      fetchSpacesAndItems();
    } catch (error) {
      console.error("Error deleting space:", error);
    }
  };

  const handleEditSpace = (spaceId) => {
    alert("Editing spaces is not implemented yet.");
  };

  const getItemPath = (item) => {
    if (!item.space_id) return "Top-level (Unassigned)";
    let path = [];
    let currentId = item.space_id;
    while (currentId) {
      const sp = spaces.find((x) => x.id === currentId);
      if (!sp) break;
      path.unshift(sp.name);
      currentId = sp.parent_id;
    }
    return path.join(" > ");
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <h1 style={{ textAlign: "center" }}>Spaces and Items</h1>

        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

        <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
          {/* Item Form */}
          <div style={{ flex: 1, border: "1px solid #ccc", padding: "10px", borderRadius: "5px" }}>
            <h3>Add a New Item</h3>
            <input
              type="text"
              placeholder="Item Name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              style={{ width: "100%", marginBottom: "10px", padding: "5px" }}
            />
            <textarea
              placeholder="Item Description"
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
              style={{ width: "100%", marginBottom: "10px", padding: "5px" }}
            />
            <button
              onClick={handleAddItem}
              style={{ width: "100%", padding: "10px", background: "#007bff", color: "#fff", border: "none", borderRadius: "5px" }}
            >
              Add Item
            </button>
          </div>

          {/* Space Form */}
          <div style={{ flex: 1, border: "1px solid #ccc", padding: "10px", borderRadius: "5px" }}>
            <h3>Add a New Space</h3>
            <input
              type="text"
              placeholder="Space Name"
              value={newSpaceName}
              onChange={(e) => setNewSpaceName(e.target.value)}
              style={{ width: "100%", marginBottom: "10px", padding: "5px" }}
            />
            <select
              value={newSpaceParentId || ""}
              onChange={(e) => setNewSpaceParentId(e.target.value || null)}
              style={{ width: "100%", marginBottom: "10px", padding: "5px" }}
            >
              <option value="">No Parent</option>
              {spaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddSpace}
              style={{ width: "100%", padding: "10px", background: "#007bff", color: "#fff", border: "none", borderRadius: "5px" }}
            >
              Add Space
            </button>
          </div>
        </div>

        {viewMode === "detail" && (
          <button onClick={handleBack} style={{ marginBottom: "10px", padding: "5px 10px" }}>
            Back
          </button>
        )}

        <ParentContainer
          spaces={displayedSpaces}
          items={displayedItems}
          onDrop={handleDrop}
          onSpaceClick={handleSpaceClick}
          onSpaceHover={handleSpaceHover}
          currentSpaceId={currentSpaceId}
          viewMode={viewMode}
          onEditSpace={handleEditSpace}
          onDeleteSpace={handleDeleteSpace}
        />

        <ItemList
          items={filteredItems} // show all items that match search
          onDrop={(id, spaceId) => handleDrop(id, spaceId, "item")}
          onEditItem={handleEditItem}
          onDeleteItem={handleDeleteItem}
          getItemPath={getItemPath}
        />
      </div>
    </DndProvider>
  );
};

export default App;

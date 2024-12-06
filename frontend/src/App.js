import React, { useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import SpaceList from "./components/SpaceList";
import ItemList from "./components/ItemList";

const App = () => {
  const [spaces, setSpaces] = useState([]);
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceParentId, setNewSpaceParentId] = useState(null);

  // Fetch spaces and items from the backend
  useEffect(() => {
    const fetchSpaces = async () => {
      const response = await fetch("http://localhost:8000/spaces-recursive/");
      const data = await response.json();
      setSpaces(data);
    };

    const fetchItems = async () => {
      const response = await fetch("http://localhost:8000/items/");
      const data = await response.json();
      setItems(data);
    };

    fetchSpaces();
    fetchItems();
  }, []);

  // Handle adding a new item
  const handleAddItem = async () => {
    if (newItemName.trim() === "") {
      alert("Item name cannot be empty!");
      return;
    }

    await fetch("http://localhost:8000/items/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newItemName,
        description: newItemDescription,
        space_id: null, // Unassigned by default
      }),
    });

    setNewItemName("");
    setNewItemDescription("");

    // Refresh items
    const responseItems = await fetch("http://localhost:8000/items/");
    setItems(await responseItems.json());
  };

  // Handle adding a new space
  const handleAddSpace = async () => {
    if (newSpaceName.trim() === "") {
      alert("Space name cannot be empty!");
      return;
    }

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

    // Refresh spaces
    const responseSpaces = await fetch("http://localhost:8000/spaces-recursive/");
    setSpaces(await responseSpaces.json());
  };

  // Handle drag-and-drop functionality
  const handleDrop = async (draggedId, targetId, type) => {
    if (type === "item") {
      await fetch(`http://localhost:8000/items/${draggedId}/space`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_space_id: targetId }),
      });
    } else if (type === "space") {
      await fetch(`http://localhost:8000/spaces/${draggedId}/parent`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_parent_id: targetId }),
      });
    }

    // Refresh data after drop
    const responseSpaces = await fetch("http://localhost:8000/spaces-recursive/");
    const responseItems = await fetch("http://localhost:8000/items/");
    setSpaces(await responseSpaces.json());
    setItems(await responseItems.json());
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app-container">
        <h1 className="app-title">Spaces and Items</h1>

        {/* Form to add a new item */}
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

        {/* Form to add a new space */}
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

        {/* Main content */}
        <div className="content-container">
          <div className="space-section">
            <SpaceList spaces={spaces} items={items} onDrop={handleDrop} />
          </div>
          <div className="item-section">
            <h2 className="section-title">Unassigned Items</h2>
            <ItemList
              items={items.filter((item) => !item.space_id)}
              onDrop={(id, spaceId) => handleDrop(id, spaceId, "item")}
            />
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default App;

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

  // Function to fetch spaces and items
  const fetchSpacesAndItems = async () => {
    console.log("Refreshing spaces and items...");
    try {
        const responseSpaces = await fetch("http://localhost:8000/spaces-recursive/");
        const responseItems = await fetch("http://localhost:8000/items/");
        const spacesData = await responseSpaces.json();
        const itemsData = await responseItems.json();
        console.log("Spaces refreshed:", spacesData);
        console.log("Items refreshed:", itemsData);
        setSpaces(spacesData);
        setItems(itemsData);
    } catch (error) {
        console.error("Error fetching spaces and items:", error);
    }
};


  // Fetch spaces and items on component mount
  useEffect(() => {
    fetchSpacesAndItems();
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
    fetchSpacesAndItems(); // Refresh data
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
    fetchSpacesAndItems(); // Refresh data
  };

  const handleDrop = async (draggedItemId, targetSpaceId) => {
    console.log("Preparing to move item:", { draggedItemId, targetSpaceId });
    try {
        const response = await fetch(
            `http://localhost:8000/items/${draggedItemId}/space`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ new_space_id: targetSpaceId }),
            }
        );

        if (!response.ok) {
            console.error("API Error:", await response.text());
            throw new Error(`Failed to move item: ${response.statusText}`);
        }

        console.log("Item moved successfully:", await response.json());

        // Refresh UI with updated data
        fetchSpacesAndItems();
    } catch (error) {
        console.error("Error during item move:", error);
    }
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

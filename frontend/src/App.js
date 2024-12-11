import React, { useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import ParentContainer from "./components/ParentContainer"; 
import ItemList from "./components/ItemList"; 

const App = () => {
  const [spaces, setSpaces] = useState([]); 
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceParentId, setNewSpaceParentId] = useState(null);

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
    return <div>Loading...</div>; // Show loading spinner or message
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

  function handleDrop(draggedItemId, targetSpaceId) {
    console.log("Handling drop:", { draggedItemId, targetSpaceId });
    
    fetch(`http://localhost:8000/spaces/${draggedItemId}/parent`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        new_parent_id: targetSpaceId,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Drop successful:", data);
      })
      .catch((error) => {
        console.error("Error during drop:", error);
      });
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

        <div className="content-container">
          <ParentContainer
            spaces={spaces}
            items={items}
            onDrop={handleDrop}
          />
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

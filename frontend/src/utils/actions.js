export const handleAddItem = async ({
    newItemName,
    newItemDescription,
    fetchSpacesAndItems,
  }) => {
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
  
      fetchSpacesAndItems(); // Refresh spaces and items
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };
  
  export const handleAddSpace = async ({
    newSpaceName,
    newSpaceParentId,
    fetchSpacesAndItems,
  }) => {
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
  
      fetchSpacesAndItems(); // Refresh spaces and items
    } catch (error) {
      console.error("Error adding space:", error);
    }
  };
  
  export const handleDrop = async ({
    draggedItemId,
    targetSpaceId,
    type,
    fetchSpacesAndItems,
  }) => {
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
      console.warn("Unknown type for drop action:", type);
      return; // Unknown type
    }
  
    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
  
      if (!response.ok) throw new Error("Failed to update");
  
      fetchSpacesAndItems(); // Refresh spaces and items
    } catch (error) {
      console.error("Error during drop:", error);
    }
  };
  
  export const handleDeleteItem = async ({ itemId, fetchSpacesAndItems }) => {
    const confirmed = window.confirm("Are you sure you want to delete this item?");
    if (!confirmed) return;
  
    try {
      const response = await fetch(`http://localhost:8000/items/${itemId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete item");
  
      fetchSpacesAndItems(); // Refresh spaces and items
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };
  
  export const handleDeleteSpace = async ({ spaceId, fetchSpacesAndItems }) => {
    const confirmed = window.confirm(
      "Deleting this space will delete all nested spaces and items. Are you sure?"
    );
    if (!confirmed) return;
  
    try {
      const response = await fetch(`http://localhost:8000/spaces/${spaceId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete space");
  
      fetchSpacesAndItems(); // Refresh spaces and items
    } catch (error) {
      console.error("Error deleting space:", error);
    }
  };
  
  export const handleEditItem = async ({
    itemId,
    newName,
    newDesc,
    fetchSpacesAndItems,
  }) => {
    try {
      const response = await fetch(`http://localhost:8000/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDesc }),
      });
      if (!response.ok) throw new Error("Failed to edit item");
  
      fetchSpacesAndItems(); // Refresh spaces and items
    } catch (error) {
      console.error("Error editing item:", error);
    }
  };
  
  export const handleEditSpace = async ({
    spaceId,
    newName,
    fetchSpacesAndItems,
  }) => {
    try {
      const response = await fetch(`http://localhost:8000/spaces/${spaceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (!response.ok) throw new Error("Failed to edit space");
  
      fetchSpacesAndItems(); // Refresh spaces and items
    } catch (error) {
      console.error("Error editing space:", error);
    }
  };
  
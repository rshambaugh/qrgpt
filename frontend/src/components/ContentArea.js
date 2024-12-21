import React, { useState, useEffect, useCallback } from "react";

// Function to get ROYGBIV colors based on item index
const getBorderColor = (index) => {
  const colors = [
    "#FF0000",
    "#FF7F00",
    "#FFFF00",
    "#00FF00",
    "#0000FF",
    "#4B0082",
    "#9400D3",
  ];
  return colors[index % colors.length];
};

// Breadcrumb Component
const Breadcrumb = ({ id, name, onClick }) => (
  <>
    <button
      onClick={() => onClick(id)}
      style={{
        color: "blue",
        textDecoration: "underline",
        cursor: "pointer",
        marginRight: "5px",
        background: "none",
        border: "none",
        padding: 0,
        fontSize: "inherit",
      }}
    >
      {name}
    </button>
    <span style={{ marginRight: "5px" }}>{'>'}</span>
  </>
);

// Generate Breadcrumbs
const generateBreadcrumbs = (spaceId, spaces, onBreadcrumbClick) => {
  const breadcrumbs = [];
  let currentId = spaceId;

  while (currentId) {
    const currentSpace = spaces.find((space) => space.id === currentId);
    if (!currentSpace) break;

    breadcrumbs.unshift({
      id: currentSpace.id,
      name: currentSpace.name,
    });

    currentId = currentSpace.parent_id;
  }

  return breadcrumbs.map((crumb) => (
    <React.Fragment key={crumb.id}>
      <Breadcrumb id={crumb.id} name={crumb.name} onClick={onBreadcrumbClick} />
    </React.Fragment>
  ));
};

// Main ContentArea Component
const ContentArea = ({
  currentSpaceId,
  spaces = [],
  items = [],
  setCurrentSpaceId,
  setSearchResults,
}) => {
  console.log("[ContentArea] Props received:", {
    currentSpaceId,
    spaces,
    items,
    setCurrentSpaceId,
  });

  const [currentSpace, setCurrentSpace] = useState(null);
  const [filteredItems, setFilteredItems] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editItemName, setEditItemName] = useState("");
  const [editItemDescription, setEditItemDescription] = useState("");

  const handleBreadcrumbClick = useCallback(
    (spaceId) => {
      if (typeof setCurrentSpaceId === "function") {
        setCurrentSpaceId(spaceId);
      }
    },
    [setCurrentSpaceId]
  );

  useEffect(() => {
    if (currentSpaceId === null) {
      setCurrentSpace(null);
      setFilteredItems([]);
      setBreadcrumbs([]);
      return;
    }

    const foundSpace = spaces.find((space) => space.id === currentSpaceId);
    setCurrentSpace(foundSpace || null);

    const filtered = items.filter((item) => item.space_id === currentSpaceId);
    setFilteredItems(filtered);

    if (foundSpace) {
      const breadcrumbLinks = generateBreadcrumbs(
        currentSpaceId,
        spaces,
        handleBreadcrumbClick
      );
      setBreadcrumbs(breadcrumbLinks);
    } else {
      setBreadcrumbs([]);
    }
  }, [currentSpaceId, items, spaces, handleBreadcrumbClick]);

  const saveEditedItem = async (itemId) => {
    console.log("[ContentArea] Attempting to save edited item:", {
      id: itemId,
      name: editItemName,
      description: editItemDescription,
      space_id: currentSpaceId,
    });
  
    try {
      const response = await fetch(`http://localhost:8000/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editItemName,
          description: editItemDescription,
          space_id: currentSpaceId,
        }),
      });
  
      if (!response.ok) throw new Error("Failed to save item");
  
      const updatedItem = await response.json();
      console.log("[ContentArea] Item updated successfully:", updatedItem);
  
      // Update filteredItems in ContentArea
      setFilteredItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId
            ? {
                ...item,
                name: updatedItem.name,
                description: updatedItem.description,
                space_id: updatedItem.space_id,
              }
            : item
        )
      );
      console.log("[ContentArea] filteredItems updated:", updatedItem);
  
      // Update search results if setSearchResults exists
      if (typeof setSearchResults === "function") {
        setSearchResults((prevResults) =>
          prevResults.map((result) =>
            result.id === itemId
              ? {
                  ...result,
                  name: updatedItem.name,
                  description: updatedItem.description,
                  space_id: updatedItem.space_id,
                }
              : result
          )
        );
        console.log("[ContentArea] Search results updated successfully.");
      }
  
      setEditingItemId(null);
    } catch (error) {
      console.error("[ContentArea] Error saving item:", error);
    }
  };
  
  
  
  const handleDeleteItem = async (itemId) => {
    console.log("[ContentArea] Deleting item:", itemId);
    try {
      const response = await fetch(`http://localhost:8000/items/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete item");

      setFilteredItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
      console.log("[ContentArea] Item deleted successfully");
    } catch (error) {
      console.error("[ContentArea] Error deleting item:", error);
    }
  };

  return (
    <div className="items-column">
      {breadcrumbs.length > 0 && <p className="breadcrumbs">{breadcrumbs}</p>}
      {currentSpace ? (
        <>
          <h2>{currentSpace.name}</h2>
          {filteredItems.length > 0 ? (
            <ul className="item-list">
              {filteredItems.map((item, index) => (
                <li
                  key={item.id}
                  className="item-card"
                  style={{ borderBottomColor: getBorderColor(index) }}
                >
                  {editingItemId === item.id ? (
                    <>
                      <input
                        type="text"
                        value={editItemName}
                        onChange={(e) => setEditItemName(e.target.value)}
                        style={{ marginRight: "5px" }}
                      />
                      <input
                        type="text"
                        value={editItemDescription}
                        onChange={(e) => setEditItemDescription(e.target.value)}
                        style={{ marginRight: "5px" }}
                      />
                      <button onClick={() => saveEditedItem(item.id)}>Save</button>
                      <button onClick={() => setEditingItemId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <strong>{item.name}</strong> - {item.description || "No description"}
                      <div style={{ marginTop: "5px" }}>
                        <button
                          onClick={() => {
                            setEditingItemId(item.id);
                            setEditItemName(item.name || "");
                            setEditItemDescription(item.description || "");
                          }}
                          style={{ marginRight: "5px" }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          style={{ color: "red" }}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No items found in this space.</p>
          )}
        </>
      ) : (
        <p>Loading space details...</p>
      )}
    </div>
  );
};

export default ContentArea;

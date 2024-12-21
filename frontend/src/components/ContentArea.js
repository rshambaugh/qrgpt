import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave, faTimes, faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";


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
  fetchItems,
  setSearchResults,
}) => {
  console.log("[ContentArea] Props received:", {
    currentSpaceId,
    spaces,
    items,
    setCurrentSpaceId,
    fetchItems,
    setSearchResults,
  });

  const [currentSpace, setCurrentSpace] = useState(null);
  const [filteredItems, setFilteredItems] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editItemName, setEditItemName] = useState("");
  const [editItemDescription, setEditItemDescription] = useState("");
  const [editItemSpaceId, setEditItemSpaceId] = useState(""); // Added for space selection

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
      space_id: editItemSpaceId || currentSpaceId,
    });
    try {
      const response = await fetch(`http://localhost:8000/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editItemName,
          description: editItemDescription,
          space_id: editItemSpaceId || currentSpaceId,
        }),
      });

      if (!response.ok) throw new Error("Failed to save item");

      const updatedItem = await response.json();
      console.log("[ContentArea] Item updated successfully:", updatedItem);

      // Update filteredItems
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

      // Fetch fresh items and update search results
      if (typeof fetchItems === "function") {
        await fetchItems();
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
      }

      setEditingItemId(null);
      setEditItemSpaceId("");
    } catch (error) {
      console.error("[ContentArea] Error saving item:", error);
    }
  };

  // Recursive function to render nested spaces with indentation
const renderNestedSpaces = (spaces, parentId = null, level = 0) => {
  return spaces
    .filter((space) => space.parent_id === parentId)
    .map((space) => (
      <React.Fragment key={space.id}>
        <option value={space.id}>
          {`${"— ".repeat(level)}${space.name}`}
        </option>
        {renderNestedSpaces(spaces, space.id, level + 1)}
      </React.Fragment>
    ));
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
                      />
                      <input
                        type="text"
                        value={editItemDescription}
                        onChange={(e) => setEditItemDescription(e.target.value)}
                      />
                      <select
                        value={editItemSpaceId}
                        onChange={(e) => setEditItemSpaceId(e.target.value)}
                      >
                        <option value="">Select Space</option>
                        {renderNestedSpaces(spaces)}
                      </select>

                      {/* Action Buttons */}
                      <div className="item-actions">
                        <FontAwesomeIcon
                          icon={faSave}
                          onClick={() => saveEditedItem(item.id)}
                          className="save-icon"
                        />
                        <FontAwesomeIcon
                          icon={faTimes}
                          onClick={() => setEditingItemId(null)}
                          className="cancel-icon"
                        />
                      </div>

                    </>
                  ) : (
                    <>
                      <strong>{item.name}</strong> - {item.description || "No description"}
                      <div>
                        <button onClick={() => {
                          setEditingItemId(item.id);
                          setEditItemName(item.name || "");
                          setEditItemDescription(item.description || "");
                          setEditItemSpaceId(item.space_id || "");
                        }}>Edit</button>
                        <button onClick={() => handleDeleteItem(item.id)}>Delete</button>
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

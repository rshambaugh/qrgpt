import React, { useEffect, useState } from "react";

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
  return colors[index % colors.length]; // Cycle through colors
};

const ContentArea = ({ currentSpaceId, spaces = [], items = [] }) => {
  console.log("[ContentArea] Props received:", { currentSpaceId, spaces, items });

  // Ensure spaces is an array
  const safeSpaces = Array.isArray(spaces) ? spaces : [];

  // Track currentSpace and filteredItems explicitly in state for debugging
  const [currentSpace, setCurrentSpace] = useState(null);
  const [filteredItems, setFilteredItems] = useState([]);

  useEffect(() => {
    console.log("[ContentArea] useEffect triggered with:", {
      currentSpaceId,
      spaces,
      items,
    });

    if (currentSpaceId === null) {
      console.warn("[ContentArea] currentSpaceId is null. No space selected.");
      setCurrentSpace(null);
      setFilteredItems([]);
      return;
    }
    
    const foundSpace = safeSpaces.find((space) => space.id === currentSpaceId);
    setCurrentSpace(foundSpace || null);
    console.log("[ContentArea] Found Space:", foundSpace);

    const filtered = Array.isArray(items)
      ? items.filter((item) => item.space_id === currentSpaceId)
      : [];
    setFilteredItems(filtered);
    console.log("[ContentArea] Filtered Items State Updated:", filtered);
  }, [currentSpaceId, spaces, items]);

  return (
    <div className="items-column">
      <h2>Content Area Debug</h2>
      <p>CurrentSpaceId: {currentSpaceId ?? "null"}</p>
      {currentSpace ? (
        <>
          <h3>Selected Space: {currentSpace.name}</h3>
          <p>Space ID: {currentSpace.id}</p>
          {filteredItems.length > 0 ? (
            <ul className="item-list">
              {filteredItems.map((item, index) => (
                <li
                  key={item.id}
                  className="item-card"
                  style={{ borderBottomColor: getBorderColor(index) }}
                >
                  {item.name} - {item.description || "No description"}
                </li>
              ))}
            </ul>
          ) : (
            <p>No items found in this space.</p>
          )}
        </>
      ) : (
        <p>
          {currentSpaceId === null
            ? "Select a space to view its contents."
            : "Loading space details..."}
        </p>
      )}
    </div>
  );
};

export default ContentArea;

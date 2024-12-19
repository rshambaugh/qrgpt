import React from "react";

// Function to get ROYGBIV colors based on item index
const getBorderColor = (index) => {
  const colors = ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#4B0082", "#9400D3"];
  return colors[index % colors.length]; // Cycle through colors
};

const ContentArea = ({ currentSpaceId, spaces = [], items = [] }) => {
  // Ensure spaces is an array
  const safeSpaces = Array.isArray(spaces) ? spaces : [];

  const currentSpace = safeSpaces.find((space) => space.id === currentSpaceId);

  const filteredItems = Array.isArray(items)
    ? items.filter((item) => item.space_id === currentSpaceId)
    : [];

  return (
    <div className="items-column">
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
                  {item.name} - {item.description || "No description"}
                </li>
              ))}
            </ul>
          ) : (
            <p>No items in this space.</p>
          )}
        </>
      ) : (
        <p>Select a space to view its contents.</p>
      )}
    </div>
  );
};

export default ContentArea;

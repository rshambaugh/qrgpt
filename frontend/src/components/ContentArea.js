import React from "react";

const ContentArea = ({ currentSpaceId, spaces = [], items = [] }) => {
  const currentSpace = spaces.find((space) => space.id === currentSpaceId);
  const filteredItems = items.filter((item) => item.space_id === currentSpaceId);

  return (
    <div className="content-area">
      {currentSpace ? (
        <>
          <h2>{currentSpace.name}</h2>
          <ul className="item-list">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <li key={item.id} className="item-card">
                  {item.name} - {item.description || "No description"}
                </li>
              ))
            ) : (
              <p>No items in this space.</p>
            )}
          </ul>
        </>
      ) : (
        <p>Select a space to view its contents.</p>
      )}
    </div>
  );
};

export default ContentArea;

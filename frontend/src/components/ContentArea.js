import React, { useEffect, useState, useCallback, useMemo } from "react";

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

// Breadcrumb Component
const Breadcrumb = ({ id, name, onClick }) => (
  <>
    <a
      href="javascript:void(0)"
      onClick={() => onClick(id)}
      style={{
        color: "blue",
        textDecoration: "underline",
        cursor: "pointer",
        marginRight: "5px",
      }}
    >
      {name}
    </a>
    <span style={{ marginRight: "5px" }}>{'>'}</span>
  </>
);

// Generate Breadcrumbs
const generateBreadcrumbs = (spaceId, spaces, onBreadcrumbClick) => {
  const breadcrumbs = [];
  let currentId = spaceId;

  while (currentId) {
    const currentSpace = spaces.find((space) => space.id === currentId);
    if (currentSpace) {
      breadcrumbs.unshift({
        id: currentSpace.id,
        name: currentSpace.name,
      });
      currentId = currentSpace.parent_id;
    } else {
      break;
    }
  }

  return breadcrumbs.map((crumb, index) => (
    <React.Fragment key={crumb.id}>
      <Breadcrumb id={crumb.id} name={crumb.name} onClick={onBreadcrumbClick} />
    </React.Fragment>
  ));
};

// Main ContentArea Component
const ContentArea = ({ currentSpaceId, spaces = [], items = [], setCurrentSpaceId }) => {
  console.log("[ContentArea] Props received:", {
    currentSpaceId,
    spaces,
    items,
    setCurrentSpaceId,
  });

  // Memoize spaces for stability
  const safeSpaces = useMemo(() => (Array.isArray(spaces) ? spaces : []), [spaces]);

  const [currentSpace, setCurrentSpace] = useState(null);
  const [filteredItems, setFilteredItems] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([]);

  // Breadcrumb click handler
  const handleBreadcrumbClick = useCallback(
    (spaceId) => {
      console.log("[Breadcrumb Clicked] Navigating to spaceId:", spaceId);
      if (typeof setCurrentSpaceId === "function") {
        setCurrentSpaceId(spaceId);
      } else {
        console.warn("[Breadcrumb Click Error] setCurrentSpaceId is not defined");
      }
    },
    [setCurrentSpaceId]
  );

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
      setBreadcrumbs([]);
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

    if (foundSpace) {
      const breadcrumbLinks = generateBreadcrumbs(
        currentSpaceId,
        safeSpaces,
        handleBreadcrumbClick
      );
      setBreadcrumbs(breadcrumbLinks);
    } else {
      setBreadcrumbs([]);
    }
  }, [currentSpaceId, items, safeSpaces, handleBreadcrumbClick]);

  return (
    <div className="items-column">
      {breadcrumbs.length > 0 && (
        <p className="breadcrumbs">{breadcrumbs}</p>
      )}
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
                  <strong>{item.name}</strong> - {item.description || "No description"}
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

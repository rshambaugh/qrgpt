import React, { useState, useEffect } from "react";
import NestedSpaces from "./components/NestedSpaces";
import AddForm from "./components/forms/AddForm";
import SearchBar from "./components/SearchBar";

const COLORS = ["#ff0000", "#ff7f00", "#ffff00", "#7fff00", "#00ff00", "#00ffff", "#007fff"]; // ROYGBIV colors

const App = () => {
  const [spaces, setSpaces] = useState([]);
  const [items, setItems] = useState([]);
  const [currentSpaceId, setCurrentSpaceId] = useState(null);

  const fetchSpaces = async () => {
    try {
      const response = await fetch("http://localhost:8000/spaces-recursive");
      if (!response.ok) throw new Error("Failed to fetch spaces.");
      const data = await response.json();
      setSpaces(data.spaces);
    } catch (error) {
      console.error("Error fetching spaces:", error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch("http://localhost:8000/items/");
      if (!response.ok) throw new Error("Failed to fetch items.");
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  useEffect(() => {
    fetchSpaces();
    fetchItems();
  }, []);

  const handleSpaceClick = (spaceId) => {
    setCurrentSpaceId(spaceId);
  };

  const generateBreadcrumbTrail = (spaceId) => {
    const trail = [];
    let currentId = spaceId;

    while (currentId) {
      const space = spaces.find((s) => s.id === currentId);
      if (space) {
        trail.unshift(space);
        currentId = space.parent_id;
      } else {
        break;
      }
    }
    return trail;
  };

  const breadcrumbTrail = currentSpaceId ? generateBreadcrumbTrail(currentSpaceId) : [];

  return (
    <div className="app-container">
      <h1 className="app-title">Spaces and Items</h1>
      <SearchBar />
      <AddForm spaces={spaces} fetchSpaces={fetchSpaces} fetchItems={fetchItems} />

      <div className="content-container">
        <div className="nested-spaces-column">
          <NestedSpaces spaces={spaces} handleSpaceClick={handleSpaceClick} />
        </div>

        <div className="items-column">
          {currentSpaceId ? (
            <>
              <div className="breadcrumb">
                {breadcrumbTrail.map((space, index) => (
                  <span key={space.id}>
                    {index < breadcrumbTrail.length - 1 ? (
                      <a onClick={() => handleSpaceClick(space.id)}>{space.name}</a>
                    ) : (
                      <span className="current">{space.name}</span>
                    )}
                    {index < breadcrumbTrail.length - 1 && " / "}
                  </span>
                ))}
              </div>

              {/* Display spaces with colored borders */}
              {spaces
                .filter((space) => space.parent_id === currentSpaceId)
                .map((space) => (
                  <div
                    key={space.id}
                    className="space-card border-colored"
                    style={{
                      borderBottomColor: COLORS[space.depth % COLORS.length],
                    }}
                  >
                    {space.name}
                  </div>
                ))}

              {/* Display items with solid background */}
              {items
                .filter((item) => item.space_id === currentSpaceId)
                .map((item) => (
                  <div key={item.id} className="item-card">
                    {item.name}
                  </div>
                ))}
            </>
          ) : (
            <p>Select a space to view its contents.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;

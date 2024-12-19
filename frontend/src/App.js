/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect } from "react";
import NestedSpaces from "./components/NestedSpaces";
import AddForm from "./components/forms/AddForm";
import SearchBar from "./components/SearchBar";
import SearchResults from "./components/SearchResults";

const App = () => {
  const [spaces, setSpaces] = useState([]);
  const [items, setItems] = useState([]);
  const [currentSpaceId, setCurrentSpaceId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemSpaceId, setNewItemSpaceId] = useState(null);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceParentId, setNewSpaceParentId] = useState(null);

  useEffect(() => {
    fetchSpaces();
    fetchItems();
  }, []);

  useEffect(() => {
    console.log("App mounted. Spaces:", spaces, "Items:", items);
  }, [spaces, items]);


  async function fetchSpaces() {
    try {
      const response = await fetch("http://localhost:8000/spaces/recursive");
      if (!response.ok) {
        console.error("Failed to fetch spaces:", response.statusText);
        return;
      }
      const data = await response.json();
      console.log("Fetched spaces:", data);
      setSpaces(data); // Use the array directly
    } catch (error) {
      console.error("Error fetching spaces:", error);
    }
  }
  
  const fetchItems = async () => {
    try {
      const response = await fetch("http://localhost:8000/items/");
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
  
    const filteredSpaces = spaces.filter((space) =>
      space.name.toLowerCase().includes(query.toLowerCase())
    );
  
    const filteredItems = items.filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
  
    setSearchResults([
      ...filteredSpaces.map((space) => ({ ...space, type: "space" })),
      ...filteredItems.map((item) => ({ ...item, type: "item" })),
    ]);
  };
  
  const onEditSpace = async (spaceId, newName) => {
    try {
      const response = await fetch(`http://localhost:8000/spaces/${spaceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
  
      if (response.ok) {
        fetchSpaces();
  
        // Update search results if a search query exists
        if (searchQuery) {
          const updatedSpaces = spaces.map((space) =>
            space.id === spaceId ? { ...space, name: newName } : space
          );
          const filteredSpaces = updatedSpaces.filter((space) =>
            space.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
  
          const filteredItems = items.filter((item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
  
          setSearchResults([
            ...filteredSpaces.map((space) => ({ ...space, type: "space", key: `space-${space.id}` })),
            ...filteredItems.map((item) => ({ ...item, type: "item", key: `item-${item.id}` })),
          ]);
        }
      } else {
        throw new Error("Failed to update space.");
      }
    } catch (error) {
      console.error("Error editing space:", error);
    }
  };
  

  const onEditItem = async (itemId, updatedFields) => {
    try {
      const response = await fetch(`http://localhost:8000/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });

      if (response.ok) {
        fetchItems();

        if (searchQuery) {
          const updatedItems = items.map((item) =>
            item.id === itemId ? { ...item, ...updatedFields } : item
          );
          const filteredItems = updatedItems.filter((item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
          );

          const filteredSpaces = spaces.filter((space) =>
            space.name.toLowerCase().includes(searchQuery.toLowerCase())
          );

          setSearchResults([
            ...filteredSpaces.map((space) => ({ ...space, type: "space", key: `space-${space.id}` })),
            ...filteredItems.map((item) => ({ ...item, type: "item", key: `item-${item.id}` })),
          ]);
        }
      } else {
        throw new Error("Failed to update item.");
      }
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  const onDeleteItem = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await fetch(`http://localhost:8000/items/${itemId}`, {
          method: "DELETE",
        });
        fetchItems();

        if (searchQuery) {
          const filteredItems = items.filter((item) => item.id !== itemId);
          const filteredSpaces = spaces.filter((space) =>
            space.name.toLowerCase().includes(searchQuery.toLowerCase())
          );

          setSearchResults([
            ...filteredSpaces.map((space) => ({ ...space, type: "space", key: `space-${space.id}` })),
            ...filteredItems.map((item) => ({ ...item, type: "item", key: `item-${item.id}` })),
          ]);
        }
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    }
  };

  const generateBreadcrumbs = (spaceId) => {
    const breadcrumbs = [];
    let currentId = spaceId;
  
    while (currentId) {
      // eslint-disable-next-line no-loop-func
      const space = spaces.find((s) => s.id === currentId);
      if (!space) break;
  
      breadcrumbs.unshift({ id: space.id, name: space.name }); // Return an object with id and name
      currentId = space.parent_id;
    }
    return breadcrumbs;
  };
  
  const handleBreadcrumbClick = (spaceId) => {
    setCurrentSpaceId(spaceId);
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Spaces and Items</h1>

      <SearchBar searchQuery={searchQuery} onSearch={handleSearch} />

      <SearchResults
        searchResults={searchResults}
        spaces={spaces}
        onEditItem={onEditItem}
        onDeleteItem={onDeleteItem}
        onEditSpace={onEditSpace} // Add this
      />


      <AddForm
        newItemName={newItemName}
        setNewItemName={setNewItemName}
        newItemDescription={newItemDescription}
        setNewItemDescription={setNewItemDescription}
        newItemSpaceId={newItemSpaceId}
        setNewItemSpaceId={setNewItemSpaceId}
        newSpaceName={newSpaceName}
        setNewSpaceName={setNewSpaceName}
        newSpaceParentId={newSpaceParentId}
        setNewSpaceParentId={setNewSpaceParentId}
        spaces={spaces}
        handleAddItem={() => console.log("Add item")}
        handleAddSpace={() => console.log("Add space")}
      />

      <div className="content-container">
        <div className="nested-spaces-column">
          <h2>Spaces</h2>
          <NestedSpaces
            spaces={spaces}
            handleSpaceClick={(spaceId) => setCurrentSpaceId(spaceId)}
            onEditSpace={() => {}}
            onDeleteSpace={() => {}}
          />
        </div>

        <div className="items-column">
          {currentSpaceId ? (
            <>
              <div className="breadcrumb">
                {generateBreadcrumbs(currentSpaceId).map((space, index, array) => (
                  // eslint-disable-next-line react/jsx-no-comment-textnodes
                  <span key={space.id}>
                    <a
                      href="#"
                      onClick={() => handleBreadcrumbClick(space.id)}
                      style={{ textDecoration: "underline", cursor: "pointer" }}
                      // eslint-disable-next-line jsx-a11y/anchor-is-valid
                    >
                      {space.name}
                    </a>
                    {index < array.length - 1 && " > "}
                  </span>
                ))}
              </div>


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

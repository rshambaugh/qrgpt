import React, { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import ParentContainer from "./components/ParentContainer";
import ItemList from "./components/ItemList";
import SearchBar from "./components/SearchBar";
import AddForm from "./components/forms/AddForm";
import useFetchSpacesAndItems from "./hooks/useFetchSpacesAndItems";
import {
  handleAddItem,
  handleAddSpace,
  handleDrop,
  handleDeleteItem,
  handleDeleteSpace,
  handleEditItem,
  handleEditSpace,
} from "./utils/actions";

const App = () => {
  const { spaces, items, fetchSpacesAndItems } = useFetchSpacesAndItems();

  const [newItemName, setNewItemName] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceParentId, setNewSpaceParentId] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [currentSpaceId, setCurrentSpaceId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const lowerTerm = searchTerm.toLowerCase();
  const filteredSpaces = spaces.filter((s) =>
    s.name.toLowerCase().includes(lowerTerm)
  );
  const filteredItems = items.filter(
    (i) =>
      i.name.toLowerCase().includes(lowerTerm) ||
      (i.description && i.description.toLowerCase().includes(lowerTerm))
  );

  let displayedSpaces = [];
  let displayedItems = [];

  if (viewMode === "list") {
    displayedSpaces = filteredSpaces.filter((s) => s.parent_id === null);
    displayedItems = filteredItems.filter((item) => item.space_id === null);
  } else {
    const currentSpace = spaces.find((s) => s.id === currentSpaceId);
    if (currentSpace) {
      displayedSpaces = filteredSpaces.filter(
        (s) => s.id === currentSpace.id || s.parent_id === currentSpace.id
      );
      displayedItems = filteredItems.filter(
        (item) => item.space_id === currentSpaceId
      );
    }
  }

  const onAddItem = () => {
    handleAddItem({
      newItemName,
      newItemDescription,
      fetchSpacesAndItems,
    });
    setNewItemName("");
    setNewItemDescription("");
  };

  const onAddSpace = () => {
    handleAddSpace({
      newSpaceName,
      newSpaceParentId,
      fetchSpacesAndItems,
    });
    setNewSpaceName("");
    setNewSpaceParentId(null);
  };

  const onDrop = (draggedItemId, targetSpaceId, type) => {
    handleDrop({
      draggedItemId,
      targetSpaceId,
      type,
      fetchSpacesAndItems,
    });
  };

  const handleSpaceClick = (spaceId) => {
    setCurrentSpaceId(spaceId);
    setViewMode("detail");
  };

  const handleBack = () => {
    if (!currentSpaceId) {
      return;
    }
    const currentSpace = spaces.find((s) => s.id === currentSpaceId);
    if (currentSpace && currentSpace.parent_id) {
      setCurrentSpaceId(currentSpace.parent_id);
    } else {
      setCurrentSpaceId(null);
      setViewMode("list");
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        className="app-container"
        style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "20px" }}
      >
        <h1 className="app-title">Spaces and Items</h1>
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

        <AddForm
          newItemName={newItemName}
          setNewItemName={setNewItemName}
          newItemDescription={newItemDescription}
          setNewItemDescription={setNewItemDescription}
          newSpaceName={newSpaceName}
          setNewSpaceName={setNewSpaceName}
          newSpaceParentId={newSpaceParentId}
          setNewSpaceParentId={setNewSpaceParentId}
          spaces={spaces}
          handleAddItem={onAddItem}
          handleAddSpace={onAddSpace}
        />

        {viewMode === "detail" && (
          <button onClick={handleBack} style={{ alignSelf: "flex-start" }}>
            Back
          </button>
        )}

        <div className="content-container" style={{ display: "flex", gap: "20px" }}>
          <ParentContainer
            spaces={displayedSpaces}
            items={displayedItems}
            onDrop={onDrop}
            handleSpaceClick={handleSpaceClick}
          />

          <ItemList
            spaces={[]}
            items={[]}
            onDrop={onDrop}
            currentSpaceId={currentSpaceId}
          />
        </div>
      </div>
    </DndProvider>
  );
};

export default App;

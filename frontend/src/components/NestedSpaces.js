import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faSave, faTimes, faArrowsAlt } from "@fortawesome/free-solid-svg-icons";
import "../styles/NestedSpaces.css";

const COLORS = ["#ff0000", "#ff7f00", "#ffff00", "#7fff00", "#00ff00", "#00ffff", "#007fff"];

const NestedSpaces = ({
  spaces,
  setSpaces,
  currentParentId = null,
  depth = 0,
  handleSpaceClick,
  onEditSpace, // From App.js
  onDeleteSpace,
  onEditItem,
  onDeleteItem,
  resetExpandedSpaces,
}) => {
  const [expandedSpaces, setExpandedSpaces] = useState([]);
  const [editingSpaceId, setEditingSpaceId] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [movingSpaceId, setMovingSpaceId] = useState(null);
  const [newParentId, setNewParentId] = useState("");
  
  const spaceRefs = useRef({});
  console.log("[NestedSpaces] Props received:", {
    spaces,
    setSpaces,
    currentParentId,
    handleSpaceClick,
  });

  
  // 🆕 Reset expanded spaces when triggered externally
  useEffect(() => {
    if (resetExpandedSpaces) {
      console.log("[NestedSpaces] Resetting expanded spaces.");
      setExpandedSpaces([]);
    }
  }, [resetExpandedSpaces]);

  /**
   * Toggle Space (Expand/Collapse and Fetch Children)
   */
  const toggleSpace = async (spaceId) => {
    console.log("[NestedSpaces] toggleSpace called with spaceId:", spaceId);
    setExpandedSpaces((prev) =>
      prev.includes(spaceId) ? prev.filter((id) => id !== spaceId) : [...prev, spaceId]
    );

    try {
      const response = await fetch(`http://localhost:8000/spaces/${spaceId}/children`);
      if (!response.ok) throw new Error("Failed to fetch children");

      const children = await response.json();
      console.log("[NestedSpaces] Fetched children:", children);

      setSpaces((prevSpaces) => {
        const uniqueChildren = children.filter(
          (child) => !prevSpaces.some((space) => space.id === child.id)
        );
        return [...prevSpaces, ...uniqueChildren];
      });
    } catch (error) {
      console.error(`Error fetching children for space ID ${spaceId}:`, error);
    }
  };

  /**
   * Handle Space Click (Expand/Collapse and Update Content Area)
   */
  const handleClick = (spaceId) => {
    console.log("[NestedSpaces] Space clicked with ID:", spaceId);
    toggleSpace(spaceId);
    if (typeof handleSpaceClick === "function") {
      handleSpaceClick(spaceId);
    }
  };

  /**
   * Handle Save Space Edit via onEditSpace
   */
  const handleSaveEdit = async (spaceId) => {
    console.log("[NestedSpaces] Saving edit for space ID:", spaceId);
    if (typeof onEditSpace === "function") {
      await onEditSpace(spaceId, editedName);
      setEditingSpaceId(null);
      setEditedName("");
    } else {
      console.warn("[NestedSpaces] onEditSpace is not defined!");
    }
  };

  /**
   * Handle Move Space
   */
  const handleMoveSpace = async (spaceId) => {
    console.log("[NestedSpaces] Moving space ID:", spaceId, "to parent ID:", newParentId);
    try {
      const response = await fetch(`http://localhost:8000/spaces/${spaceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parent_id: newParentId }),
      });

      if (!response.ok) throw new Error("Failed to move space");

      const updatedSpace = await response.json();
      console.log("[NestedSpaces] Space moved successfully:", updatedSpace);

      setSpaces((prevSpaces) =>
        prevSpaces.map((space) =>
          space.id === spaceId ? { ...space, parent_id: updatedSpace.parent_id } : space
        )
      );

      setMovingSpaceId(null);
      setNewParentId("");
    } catch (error) {
      console.error("[NestedSpaces] Error moving space:", error);
    }
  };

  /**
   * Render Nested Dropdown for Move Form
   */
  const renderNestedSpaces = (spaces, parentId = null, level = 0, excludeId = null) => {
    return spaces
      .filter((space) => space.parent_id === parentId && space.id !== excludeId)
      .map((space) => (
        <React.Fragment key={space.id}>
          <option value={space.id}>
            {`${"— ".repeat(level)}${space.name}`}
          </option>
          {renderNestedSpaces(spaces, space.id, level + 1, excludeId)}
        </React.Fragment>
      ));
  };

  const safeSpaces = Array.isArray(spaces) ? spaces : [];
  const childSpaces = safeSpaces.filter((space) => space.parent_id === currentParentId);

  return (
    <div className="nested-spaces">
      {childSpaces.map((space) => (
        <div
          key={space.id}
          ref={(el) => (spaceRefs.current[space.id] = el)}
          className={`space-card ${expandedSpaces.includes(space.id) ? "expanded" : ""}`}
          style={{
            borderBottom: `3px solid ${COLORS[depth % COLORS.length]}`,
          }}
        >
          <div className="space-header">
            {/* Move Space Form */}
            {movingSpaceId === space.id ? (
              <div className="move-space-form">
                <select
                  value={newParentId}
                  onChange={(e) => setNewParentId(e.target.value)}
                  className="move-select"
                >
                  <option value="">Select New Parent Space</option>
                  {renderNestedSpaces(spaces, null, 0, space.id)}
                </select>
                <button onClick={() => handleMoveSpace(space.id)}>
                  <FontAwesomeIcon icon={faSave} /> Move
                </button>
                <button onClick={() => setMovingSpaceId(null)}>
                  <FontAwesomeIcon icon={faTimes} /> Cancel
                </button>
              </div>
            ) : editingSpaceId === space.id ? (
              <div className="edit-form">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                />
                <button onClick={() => handleSaveEdit(space.id)}>
                  <FontAwesomeIcon icon={faSave} /> Save
                </button>
              </div>
            ) : (
              <>
                <span className="space-name" onClick={() => {
                    toggleSpace(space.id);
                    handleClick(space.id);
                  }}
                >
                  {space.name}
                  </span>
                <div className="space-actions">
                  <FontAwesomeIcon icon={faEdit} onClick={() => setEditingSpaceId(space.id)} />
                  <FontAwesomeIcon icon={faArrowsAlt} onClick={() => setMovingSpaceId(space.id)} />
                  <FontAwesomeIcon icon={faTrash} onClick={() => onDeleteSpace(space.id)} />
                </div>
              </>
            )}
          </div>
          {/* Render Children if Space is Expanded */}
          {expandedSpaces.includes(space.id) && (
            <div className="nested-space-children">
              <NestedSpaces
                spaces={safeSpaces}
                setSpaces={setSpaces}
                currentParentId={space.id}
                depth={depth + 1}
                handleSpaceClick={handleSpaceClick}
                onEditSpace={onEditSpace}
                onDeleteSpace={onDeleteSpace}
                onEditItem={onEditItem}
                onDeleteItem={onDeleteItem}
                resetExpandedSpaces={resetExpandedSpaces} // Pass down reset flag
              />
            </div>
            )}
        </div>
      ))}
    </div>
  );
};

export default NestedSpaces;

import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faSave } from "@fortawesome/free-solid-svg-icons";
import "../styles/NestedSpaces.css";

const COLORS = ["#ff0000", "#ff7f00", "#ffff00", "#7fff00", "#00ff00", "#00ffff", "#007fff"];

const NestedSpaces = ({
  spaces,
  setSpaces,
  currentParentId = null,
  depth = 0,
  handleSpaceClick,
  onEditSpace,
  onDeleteSpace,
  onEditItem,
  onDeleteItem,
  resetExpandedSpaces,
}) => {
  const [expandedSpaces, setExpandedSpaces] = useState([]);
  const [editingSpaceId, setEditingSpaceId] = useState(null);
  const [editedName, setEditedName] = useState("");

  const spaceRefs = useRef({});

  useEffect(() => {
    if (resetExpandedSpaces) {
      console.log("[NestedSpaces] Resetting expanded spaces.");
      setExpandedSpaces([]);
    }
  }, [resetExpandedSpaces]);

  const toggleSpace = async (spaceId) => {
    console.log("[NestedSpaces] toggleSpace called with spaceId:", spaceId);
    setExpandedSpaces((prev) => {
      if (prev.includes(spaceId)) {
        return prev.filter((id) => id !== spaceId);
      } else {
        return [...prev, spaceId];
      }
    });

    try {
      const response = await fetch(`http://localhost:8000/spaces/${spaceId}/children`);
      if (!response.ok) {
        console.error(`Failed to fetch children for space ID ${spaceId}: ${response.statusText}`);
        return;
      }

      const children = await response.json();
      console.log("[NestedSpaces] Fetched children:", children);

      if (children.length > 0 && typeof setSpaces === "function") {
        setSpaces((prevSpaces) => {
          const uniqueChildren = children.filter(
            (child) => !prevSpaces.some((space) => space.id === child.id)
          );
          return [...prevSpaces, ...uniqueChildren];
        });
      } else {
        console.warn(`No children found for space ID ${spaceId}`);
      }
    } catch (error) {
      console.error(`Error fetching children for space ID ${spaceId}:`, error);
    }
  };

  const handleClick = (spaceId) => {
    console.log("[NestedSpaces] Space clicked with ID:", spaceId);
    if (typeof handleSpaceClick === "function") {
      handleSpaceClick(spaceId);
    } else {
      console.warn("[NestedSpaces] handleSpaceClick is undefined!");
    }
  };

  const handleSaveEdit = (spaceId) => {
    console.log("[NestedSpaces] Saving edit for space ID:", spaceId);
    if (typeof onEditSpace === "function") {
      onEditSpace(spaceId, editedName);
    }
    setEditingSpaceId(null);
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
            {editingSpaceId === space.id ? (
              <div className="edit-form">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  placeholder="Edit space name"
                  className="edit-input"
                />
                <button
                  onClick={() => handleSaveEdit(space.id)}
                  className="save-button"
                >
                  <FontAwesomeIcon icon={faSave} />
                </button>
              </div>
            ) : (
              <>
                <span
                  className="space-name"
                  onClick={() => {
                    toggleSpace(space.id);
                    handleClick(space.id);
                  }}
                >
                  {space.name}
                </span>

                <div className="space-actions">
                  <FontAwesomeIcon
                    icon={faEdit}
                    onClick={() => {
                      setEditingSpaceId(space.id);
                      setEditedName(space.name);
                    }}
                    className="edit-icon"
                  />
                  <FontAwesomeIcon
                    icon={faTrash}
                    onClick={() => onDeleteSpace(space.id)}
                    className="delete-icon"
                  />
                </div>
              </>
            )}
          </div>

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
                resetExpandedSpaces={resetExpandedSpaces}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default NestedSpaces;

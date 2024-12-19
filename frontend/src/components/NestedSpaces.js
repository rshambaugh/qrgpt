import React, { useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash, faSave } from "@fortawesome/free-solid-svg-icons";
import "./NestedSpaces.css";

const COLORS = ["#ff0000", "#ff7f00", "#ffff00", "#7fff00", "#00ff00", "#00ffff", "#007fff"];

const NestedSpaces = ({
  spaces,
  setSpaces, // Add this prop
  currentParentId = null,
  depth = 0,
  handleSpaceClick,
  onEditSpace,
  onDeleteSpace,
}) => {
  const [expandedSpaces, setExpandedSpaces] = useState([]);
  const [editingSpaceId, setEditingSpaceId] = useState(null);
  const [editedName, setEditedName] = useState("");

  const spaceRefs = useRef({});

  const toggleSpace = async (spaceId) => {
    if (expandedSpaces.includes(spaceId)) {
      setExpandedSpaces((prev) => prev.filter((id) => id !== spaceId));
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/spaces/${spaceId}/children`);
      if (!response.ok) {
        console.error(`Failed to fetch children for space ID ${spaceId}: ${response.statusText}`);
        return;
      }

      const children = await response.json();

      if (children.length > 0) {
        setSpaces((prevSpaces) => [...prevSpaces, ...children]); // Use setSpaces from props
        setExpandedSpaces((prev) => [...prev, spaceId]);
      } else {
        console.warn(`No children found for space ID ${spaceId}`);
      }
    } catch (error) {
      console.error(`Error fetching children for space ID ${spaceId}:`, error);
    }
  };

  const safeSpaces = Array.isArray(spaces) ? spaces : [];
  const childSpaces = safeSpaces.filter((space) => space.parent_id === currentParentId);

  return (
    <div className="nested-spaces">
      {childSpaces.map((space) => (
        <div
          key={space.id}
          ref={(el) => (spaceRefs.current[space.id] = el)}
          className="space-card"
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
                  onClick={() => {
                    onEditSpace(space.id, editedName);
                    setEditingSpaceId(null);
                  }}
                  className="save-button"
                >
                  <FontAwesomeIcon icon={faSave} />
                </button>
              </div>
            ) : (
              <>
                <span className="space-name" onClick={() => toggleSpace(space.id)}>
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
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default NestedSpaces;

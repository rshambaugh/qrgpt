import React, { useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import "./NestedSpaces.css";

const COLORS = ["#ff0000", "#ff7f00", "#ffff00", "#7fff00", "#00ff00", "#00ffff", "#007fff"]; // ROYGBIV colors

const NestedSpaces = ({
  spaces,
  currentParentId = null,
  depth = 0,
  handleSpaceClick,
  onEditSpace,
  onDeleteSpace,
}) => {
  const [expandedSpaces, setExpandedSpaces] = useState({}); // Local state for expanded spaces
  const spaceRefs = useRef({}); // Ref to track DOM elements of spaces

  // Toggle space expansion and notify parent about position
  const toggleSpace = (spaceId) => {
    setExpandedSpaces((prev) => ({
      ...prev,
      [spaceId]: !prev[spaceId],
    }));

    // Capture space position and send it to parent (App)
    if (spaceRefs.current[spaceId]) {
      const rect = spaceRefs.current[spaceId].getBoundingClientRect();
      handleSpaceClick(spaceId, rect.top + window.scrollY);
    }
  };

  const childSpaces = spaces.filter((space) => space.parent_id === currentParentId);

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
          <div className="space-header" onClick={() => toggleSpace(space.id)}>
            <span className="space-name">{space.name}</span>
            <div className="space-actions">
              <FontAwesomeIcon
                icon={faEdit}
                onClick={() => onEditSpace(space.id, space.name)}
                className="edit-icon"
              />
              <FontAwesomeIcon
                icon={faTrash}
                onClick={() => onDeleteSpace(space.id)}
                className="delete-icon"
              />
            </div>
          </div>

          {expandedSpaces[space.id] && (
            <div className="nested-space-children">
              <NestedSpaces
                spaces={spaces}
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

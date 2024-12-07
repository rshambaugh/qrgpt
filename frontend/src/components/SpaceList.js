import React from "react";
import Space from "./Space";

const SpaceList = ({ spaces, items, onDrop }) => {
  // Render spaces recursively
  const renderSpaces = (parentId) =>
    spaces
      .filter((space) => space.parent_id === parentId)
      .map((space) => (
        <Space
          key={space.id}
          space={space}
          items={items.filter((item) => item.space_id === space.id)}
          onDrop={onDrop}
        >
          {renderSpaces(space.id)} {/* Recursive call to render children */}
        </Space>
      ));

  // Render root-level spaces (parent_id === null)
  return <div className="space-list">{renderSpaces(null)}</div>;
};

export default SpaceList;

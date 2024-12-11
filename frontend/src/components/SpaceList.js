import React from 'react';
import Space from './Space';

const SpaceList = ({ spaces, items, onDrop }) => {
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
          {renderSpaces(space.id)}
        </Space>
      ));

  return <div className="space-list">{renderSpaces(null)}</div>;
};

export default SpaceList;
import React, { useState } from 'react';
import Space from './Space';
import SpaceView from './SpaceView';

const SpaceList = ({ spaces, items, onDrop }) => {
  const [currentSpaceId, setCurrentSpaceId] = useState(null);

  const handleViewSpace = (spaceId) => {
    setCurrentSpaceId(spaceId);
  };

  const handleBack = () => {
    setCurrentSpaceId(null);
  };

  if (currentSpaceId) {
    return <SpaceView spaceId={currentSpaceId} onBack={handleBack} />;
  }

  const renderSpaces = (parentId) =>
    spaces
      .filter((space) => space.parent_id === parentId)
      .map((space) => (
        <Space
          key={space.id}
          space={space}
          items={items.filter((item) => item.space_id === space.id)}
          onDrop={onDrop}
          viewSpace={handleViewSpace}
        />
      ));

  return <div className="space-list">{renderSpaces(null)}</div>;
};

export default SpaceList;

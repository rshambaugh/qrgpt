function SpaceList({ spaces, items, onDrop, onSpaceClick, currentSpaceId }) {
  const renderSpaces = (parentId) =>
    spaces
      .filter((space) => space.parent_id === parentId)
      .map((space) => (
        <Space
          key={space.id}
          space={space}
          items={items.filter((item) => item.space_id === space.id)}
          onDrop={onDrop}
          onSpaceClick={onSpaceClick}
        />
      ));

  if (currentSpaceId) {
    // detail mode: show just current space and its children
    const currentSpace = spaces.find(s => s.id === currentSpaceId);
    if (!currentSpace) return <div>Space not found</div>;

    return (
      <div>
        <Space
          space={currentSpace}
          items={items.filter(i => i.space_id === currentSpaceId)}
          onDrop={onDrop}
          onSpaceClick={onSpaceClick}
        />
        <div style={{ paddingLeft: "20px" }}>
          {renderSpaces(currentSpaceId)}
        </div>
      </div>
    );
  } else {
    // list mode: show top-level spaces
    return <div>{renderSpaces(null)}</div>;
  }
}

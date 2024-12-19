import React from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const DragAndDropGrid = ({ containers, items, moveItem }) => {
  const Item = ({ item }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: "ITEM",
      item: { id: item.id },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }));

    return (
      <div
        ref={drag}
        style={{
          opacity: isDragging ? 0.5 : 1,
          backgroundColor: "lightgray",
          padding: "8px",
          margin: "4px",
          border: "1px solid gray",
          borderRadius: "4px",
        }}
      >
        {item.name}
      </div>
    );
  };

  const Container = ({ container, items }) => {
    const [, drop] = useDrop(() => ({
      accept: "ITEM",
      drop: (draggedItem) => moveItem(draggedItem.id, container.id),
    }));

    return (
      <div
        ref={drop}
        style={{
          border: "2px dashed gray",
          padding: "16px",
          margin: "8px",
          borderRadius: "4px",
        }}
      >
        <h3>{container.name}</h3>
        <p>Location: {container.default_location || "Not set"}</p>
        {items.map((item) => (
          <Item key={item.id} item={item} />
        ))}
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {containers.map((container) => (
          <Container
            key={container.id}
            container={container}
            items={items.filter((item) => item.container_id === container.id)}
          />
        ))}
      </div>
    </DndProvider>
  );
};

export default DragAndDropGrid;

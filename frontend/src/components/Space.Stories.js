import React from "react";
import Space from "./Space";

console.log("Space.stories.js loaded");

export default {
  title: "Components/Space", // Group it under "Components" in Storybook
  component: Space,
};

const Template = (args) => <Space {...args} />;

export const Default = Template.bind({});
Default.args = {
  space: { id: 1, name: "Default Space" },
  items: [],
  onDrop: (draggedId, targetId, type) => console.log(`Dropped ${type} ${draggedId} on ${targetId}`),
  onSpaceClick: (id) => console.log(`Space clicked: ${id}`),
  onDeleteSpace: (id) => console.log(`Deleted space: ${id}`),
  onEditSpace: (id, newName) => console.log(`Edited space ${id} to ${newName}`),
};

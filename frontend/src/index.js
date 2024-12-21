// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/Styles.css'; // Import your global styles
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';

// FontAwesome setup
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';

library.add(fas);

// Mock data for spaces and items
const mockSpaces = [
  { id: 1, name: "Main Space", parent_id: null },
  { id: 2, name: "Shelf 1", parent_id: 1 },
  { id: 3, name: "Box 1", parent_id: 2 },
];

const mockItems = [
  { id: 1, name: "Item A", space_id: 2 },
  { id: 2, name: "Item B", space_id: 3 },
];

// Define mock handler functions
const mockHandlers = {
  onAddItem: () => console.log("Add Item"),
  onAddSpace: () => console.log("Add Space"),
  onEditItem: () => console.log("Edit Item"),
  onEditSpace: () => console.log("Edit Space"),
  onDeleteItem: () => console.log("Delete Item"),
  onDeleteSpace: () => console.log("Delete Space"),
};

// Find the root element in your HTML
const rootElement = document.getElementById('root');

// Use createRoot instead of ReactDOM.render
const root = createRoot(rootElement);

// Render your App component with mock props
root.render(
  <React.StrictMode>
    <App
      spaces={mockSpaces}
      items={mockItems}
      {...mockHandlers} // Spread the mock handler functions
    />
  </React.StrictMode>
);

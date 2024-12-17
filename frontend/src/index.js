// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css'; // Import your global styles
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';

// FontAwesome setup
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

library.add(fas);

// Find the root element in your HTML
const rootElement = document.getElementById('root');

// Use createRoot instead of ReactDOM.render
const root = createRoot(rootElement);

// Render your App component
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

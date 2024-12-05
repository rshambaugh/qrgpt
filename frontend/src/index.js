// src/index.js
import React from 'react';
import ReactDOM from 'react-dom';
import './styles.css'; // Import your global styles
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';

ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root')
);

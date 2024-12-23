// src/components/AppHeader.js

import React from "react";
import "../styles/Header.css";
import logo from "../assets/logosmall.webp"; 

function AppHeader() {
  return (
    <header className="app-header">
      <img src={logo} alt="SpaceForThat Logo" className="app-logo" />
    </header>
  );
}

export default AppHeader;

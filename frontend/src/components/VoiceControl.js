import React, { useState } from "react";

const VoiceControl = () => {
  const [commandText, setCommandText] = useState("");
  const [responseMessage, setResponseMessage] = useState("");

  const handleInputChange = (e) => {
    setCommandText(e.target.value);
  };

  const handleInterpret = async () => {
    if (!commandText.trim()) {
      setResponseMessage("Please enter a command or question first.");
      return;
    }

    try {
      setResponseMessage("Interpreting command...");
      const res = await fetch("http://localhost:8000/voice/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commandText }),
      });

      if (!res.ok) {
        throw new Error(`Failed: ${res.statusText}`);
      }

      const data = await res.json();
      setResponseMessage(data.message);
    } catch (error) {
      console.error("Interpret error:", error);
      setResponseMessage("An error occurred. See console for details.");
    }
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: "10px", margin: "10px 0" }}>
      <h3>Voice Control (Text Simulation)</h3>
      <p>Type a natural command (like "Where is my hammer?" or "Move the hammer to the garage.")</p>
      
      <textarea
        rows="2"
        style={{ width: "100%" }}
        value={commandText}
        onChange={handleInputChange}
      />

      <button onClick={handleInterpret} style={{ marginTop: "5px" }}>
        Interpret Command
      </button>

      {responseMessage && (
        <div style={{ marginTop: "10px", color: "blue" }}>
          <strong>Assistant:</strong> {responseMessage}
        </div>
      )}
    </div>
  );
};

export default VoiceControl;

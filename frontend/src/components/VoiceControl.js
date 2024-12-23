import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import '../styles/VoiceControl.css'; // Import the new styles


const VoiceControl = ({ fetchSpaces, fetchItems }) => {
  const [mode, setMode] = useState('voice'); // 'voice' or 'text'
  const [commandText, setCommandText] = useState('');
  const [transcript, setTranscript] = useState('');
  const [recognizing, setRecognizing] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [voiceError, setVoiceError] = useState(null);
  const [objectType, setObjectType] = useState('item'); // 'item' or 'space'

  let recognition;

  // Check for Speech Recognition support
  if ('webkitSpeechRecognition' in window) {
    recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
  }

  // ---------------------------
  // Microphone-Based Command (Voice Mode)
  // ---------------------------
  const startRecognition = () => {
    if (!recognition) {
      alert('Speech Recognition is not supported in this browser.');
      return;
    }

    setTranscript('');
    setVoiceError(null);
    recognition.start();
    setRecognizing(true);

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      recognition.stop();
      setRecognizing(false);
      setTranscript(finalTranscript.trim());
    };

    recognition.onerror = (event) => {
      recognition.stop();
      setRecognizing(false);
      setVoiceError(`Recognition error: ${event.error}`);
    };
  };

  useEffect(() => {
    if (transcript) {
      interpretCommand(transcript);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);

  // ---------------------------
  // Text-Based Command (Text Mode)
  // ---------------------------
  const handleInputChange = (e) => {
    setCommandText(e.target.value);
  };

  const handleTextInterpret = async () => {
    if (!commandText.trim()) {
      setResponseMessage('Please enter a command or question first.');
      return;
    }
    interpretCommand(commandText);
  };

  // ---------------------------
  // Shared Interpretation Logic
  // ---------------------------
  const interpretCommand = async (userCommand) => {
    console.log(`[VoiceControl] Sending to /interpret with objectType: ${objectType}`, userCommand);
    try {
      setResponseMessage('Interpreting command...');
      const res = await fetch(`http://localhost:8000/voice/interpret?object_type=${objectType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userCommand }),
      });

      if (!res.ok) {
        throw new Error(`Failed to interpret command: ${res.statusText}`);
      }

      const data = await res.json();
      console.log('[VoiceControl] Response data:', data);

      const { parsedResponse, finalResult } = data;

      if (!parsedResponse || !finalResult) {
        setResponseMessage(data.message || 'Command executed, but no details returned.');
        return;
      }

      // Action-Specific Handling
      switch (parsedResponse.action) {
        case 'move_item':
        case 'move_space':
        case 'create_item': 
        case 'create_space':
        case 'delete_item':
        case 'delete_space':
        case 'create_nested_space':
          console.log(finalResult.message || 'Command executed successfully');
          setResponseMessage(finalResult.message || 'Command executed successfully');
          fetchSpaces();
          fetchItems();
          break;
        case 'find_item':
        case 'find_space':
          console.log(finalResult.message || `${objectType} found.`);
          setResponseMessage(finalResult.message || `${objectType} found.`);
          break;
        case 'unknown':
          console.warn('Command not understood. Please rephrase.');
          setResponseMessage('Command not understood. Please rephrase.');
          break;
        default:
          console.error('Unhandled action. Please check the logs.');
          setResponseMessage('Unhandled action. Please check the logs.');
      }
    } catch (error) {
      console.error('[VoiceControl] Error:', error);
      setVoiceError(error.message);
      setResponseMessage('An error occurred. See console for details.');
    }
  };

  return (
    <div className="voice-control-container">
      <h3 className="voice-control-header">Voice Control</h3>

      {/* Mode Selection */}
      <div className="voice-control-modes">
        <label>
          <input
            type="radio"
            value="voice"
            checked={mode === 'voice'}
            onChange={() => setMode('voice')}
          />
          Voice Mode
        </label>
        <label>
          <input
            type="radio"
            value="text"
            checked={mode === 'text'}
            onChange={() => setMode('text')}
          />
          Text Mode
        </label>
      </div>

      {/* Find Mode */}
      <div className="voice-control-find-mode">
        <button
          className={objectType === 'item' ? 'active' : ''}
          onClick={() => setObjectType('item')}
        >
          Find Item
        </button>
        <button
          className={objectType === 'space' ? 'active' : ''}
          onClick={() => setObjectType('space')}
        >
          Find Space
        </button>
      </div>

      {/* Command Input */}
      {mode === 'voice' ? (
        <div className="voice-control-button">
          <button onClick={startRecognition} disabled={recognizing}>
            {recognizing ? 'Listening...' : 'Start Voice Command'}
          </button>
          {transcript && <p><strong>Heard:</strong> {transcript}</p>}
          {voiceError && <p className="voice-control-error"><strong>Error:</strong> {voiceError}</p>}
        </div>
      ) : (
        <div>
          <textarea
            rows="2"
            className="voice-control-textarea"
            value={commandText}
            onChange={handleInputChange}
          />
          <div className="voice-control-button">
            <button onClick={handleTextInterpret}>
              Interpret Command
            </button>
          </div>
        </div>
      )}

      {/* Response Message */}
      {responseMessage && (
        <div className="voice-control-response">
          <strong>Response:</strong> {responseMessage}
        </div>
      )}
    </div>
  );
};

VoiceControl.propTypes = {
  fetchSpaces: PropTypes.func.isRequired,
  fetchItems: PropTypes.func.isRequired,
};

export default VoiceControl;
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const VoiceControl = ({ fetchSpaces, fetchItems }) => {
const [mode, setMode] = useState('voice'); // 'voice' or 'text'
const [commandText, setCommandText] = useState('');
const [transcript, setTranscript] = useState('');
const [recognizing, setRecognizing] = useState(false);
const [responseMessage, setResponseMessage] = useState('');
const [voiceError, setVoiceError] = useState(null);

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
    console.log('[VoiceControl] Sending to /interpret:', userCommand);
    try {
      setResponseMessage('Interpreting command...');
      const res = await fetch('http://localhost:8000/voice/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userCommand }), // Ensure key matches backend
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
          alert(finalResult.message || 'Command executed successfully');
          fetchSpaces();
          fetchItems();
          break;
        case 'find_item':
          alert(finalResult.message || 'Item found.');
          break;
        case 'unknown':
          alert('Command not understood. Please rephrase.');
          break;
        default:
          alert('Unhandled action. Please check the logs.');
      }

      setResponseMessage(finalResult.message || data.message);
    } catch (error) {
      console.error('[VoiceControl] Error:', error);
      setVoiceError(error.message);
      setResponseMessage('An error occurred. See console for details.');
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
      <h3>Voice Control</h3>
      <div>
        <label>
          <input
            type="radio"
            value="voice"
            checked={mode === 'voice'}
            onChange={() => setMode('voice')}
          />
          Voice Mode
        </label>
        <label style={{ marginLeft: '10px' }}>
          <input
            type="radio"
            value="text"
            checked={mode === 'text'}
            onChange={() => setMode('text')}
          />
          Text Mode
        </label>
      </div>

      {mode === 'voice' ? (
        <div>
          <button onClick={startRecognition} disabled={recognizing}>
            {recognizing ? 'Listening...' : 'Start Voice Command'}
          </button>
          {transcript && <p><strong>Heard:</strong> {transcript}</p>}
          {voiceError && <p style={{ color: 'red' }}><strong>Error:</strong> {voiceError}</p>}
        </div>
      ) : (
        <div>
          <textarea
            rows="2"
            style={{ width: '100%' }}
            value={commandText}
            onChange={handleInputChange}
          />
          <button onClick={handleTextInterpret} style={{ marginTop: '5px' }}>
            Interpret Command
          </button>
        </div>
      )}

      {responseMessage && (
        <div style={{ marginTop: '10px', color: 'blue' }}>
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

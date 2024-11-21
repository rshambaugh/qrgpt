import axios from 'axios';

// Get the base URL from environment variables, or default to localhost for local testing
const baseURL = process.env.REACT_APP_BASE_URL || 'http://localhost:8000';

// Log the base URL to confirm it's correct
console.log('API Base URL:', baseURL);

const api = axios.create({
    baseURL: baseURL, // Now it uses the correct base URL
});

export default api;

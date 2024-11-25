import axios from 'axios';

// Configure Axios instance
const apiClient = axios.create({
    baseURL: 'http://localhost:8000', // Replace with your backend base URL
    timeout: 5000, // 5 seconds timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

export default apiClient;

import React, { useEffect } from 'react';
import apiClient from './src/services/api';

function App() {
    useEffect(() => {
        const testApi = async () => {
            try {
                const response = await apiClient.get('/items/');
                console.log('API Test Response:', response.data);
            } catch (error) {
                console.error('API Test Error:', error);
            }
        };
        testApi();
    }, []);

    return <div>Testing API...</div>;
}

export default App;

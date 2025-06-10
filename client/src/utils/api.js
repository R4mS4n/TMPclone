import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://tmp-9643.onrender.com/api';

const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient; 
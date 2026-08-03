// frontend/src/api/axiosInstance.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true, // Allows HttpOnly cookies to be sent with requests
});

export default api;
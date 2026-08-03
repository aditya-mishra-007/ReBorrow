// frontend/src/services/api.ts
import axios from 'axios';

const API = axios.create({
  // Use import.meta.env to access Vite environment variables
  baseURL: import.meta.env.VITE_API_URL, 
  withCredentials: true,             
  headers: {
    'Content-Type': 'application/json',
  },
});

export default API;
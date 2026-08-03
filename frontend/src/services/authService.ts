// frontend/src/services/authService.ts
import API from './api';

export const loginUser = async (credentials: any) => {
  const response = await API.post('/auth/login', credentials);
  return response.data;
};

export const registerUser = async (userData: any) => {
  const response = await API.post('/auth/register', userData);
  return response.data;
};
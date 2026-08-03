// frontend/src/services/assetService.ts
import API from './api';

export const getAssets = async () => {
  const response = await API.get('/assets'); // Adjust endpoint path to match your backend routes
  return response.data;
};

export const createAsset = async (assetData: any) => {
  const response = await API.post('/assets', assetData);
  return response.data;
};
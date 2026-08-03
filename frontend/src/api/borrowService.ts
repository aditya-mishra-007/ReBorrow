// frontend/src/api/borrowService.ts
import api from './axiosInstance';

export interface BorrowRequestData {
  assetId: string;
  startDate: string;
  endDate: string;
}

export const createBorrowRequest = async (data: BorrowRequestData) => {
  const response = await api.post('/api/borrow', data);
  return response.data;
};

export const fetchUserRequests = async () => {
  const response = await api.get('/api/borrow');
  return response.data;
};

export const updateRequestStatus = async (requestId: string, status: 'approved' | 'rejected') => {
  const response = await api.patch(`/api/borrow/${requestId}/status`, { status });
  return response.data;
};
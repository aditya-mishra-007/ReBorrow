import api from '@/lib/api';
import type { AdminStats, ApiResponse, Asset, PaginatedApiResponse, User, UserRole } from '@/types';

/**
 * adminApi.ts
 * ------------------------------------------------------------------
 * Typed wrapper functions for all /api/admin/* endpoints. Every
 * function here will receive a 403 from the backend if called by a
 * non-admin user — this file doesn't duplicate that check client-side
 * beyond hiding the UI entry points from non-admins (see
 * AdminRoute.tsx), consistent with the pattern established throughout
 * this app: the backend is the actual authority.
 */

export async function getStats(): Promise<ApiResponse<AdminStats>> {
  const response = await api.get<ApiResponse<AdminStats>>('/admin/stats');
  return response.data;
}

export interface GetAdminListParams {
  page?: number;
  limit?: number;
}

export async function getAllUsers(
  params?: GetAdminListParams
): Promise<PaginatedApiResponse<User[]>> {
  const response = await api.get<PaginatedApiResponse<User[]>>('/admin/users', { params });
  return response.data;
}

export async function deleteUser(userId: string): Promise<ApiResponse<null>> {
  const response = await api.delete<ApiResponse<null>>(`/admin/users/${userId}`);
  return response.data;
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<ApiResponse<User>> {
  const response = await api.patch<ApiResponse<User>>(`/admin/users/${userId}/role`, { role });
  return response.data;
}

export async function getAllAssetsAdmin(
  params?: GetAdminListParams
): Promise<PaginatedApiResponse<Asset[]>> {
  const response = await api.get<PaginatedApiResponse<Asset[]>>('/admin/assets', { params });
  return response.data;
}

export async function deleteAssetAdmin(assetId: string): Promise<ApiResponse<null>> {
  const response = await api.delete<ApiResponse<null>>(`/admin/assets/${assetId}`);
  return response.data;
}
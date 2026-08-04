import api from '@/lib/api';
import type {
  ApiResponse,
  Asset,
  AssetStatus,
  CreateAssetPayload,
  UpdateAssetPayload,
} from '@/types';

/**
 * assetApi.ts
 * ------------------------------------------------------------------
 * Typed wrapper functions around the shared `api` axios instance for
 * all asset-related backend endpoints. Mirrors
 * backend/src/routes/assetRoutes.ts exactly:
 *
 *   GET    /api/assets       -> getAssets()
 *   GET    /api/assets/:id   -> getAssetById()
 *   POST   /api/assets       -> createAsset()
 *   PUT    /api/assets/:id   -> updateAsset()
 *   DELETE /api/assets/:id   -> deleteAsset()
 *
 * As with authApi.ts, these are thin, side-effect-free HTTP wrappers.
 * Loading states, error toasts, and local state updates are handled
 * by the calling components/hooks, not here.
 */

/**
 * GetAssetsParams
 * ------------------------------------------------------------------
 * Mirrors the optional query params accepted by `getAssets` in
 * assetController.ts. All fields optional since browsing with no
 * filters at all is the default/most common case.
 *
 * `owner`: pass 'me' to fetch only the current authenticated user's
 * own assets (resolved server-side against the verified JWT — see
 * assetController.ts). A raw ObjectId string is also accepted for
 * filtering by a specific owner.
 */
export interface GetAssetsParams {
  status?: AssetStatus;
  category?: string;
  search?: string;
  owner?: 'me' | string;
}

/**
 * getAssets
 * ------------------------------------------------------------------
 * Fetches the list of assets, optionally filtered by status/category/
 * owner or full-text searched. Public endpoint — works with or
 * without an auth token (the request interceptor attaches one if
 * present, but the backend route has no `protect` middleware on
 * GET /, except when owner=me is used without a token, which the
 * backend rejects with 401).
 */
export async function getAssets(params?: GetAssetsParams): Promise<ApiResponse<Asset[]>> {
  const response = await api.get<ApiResponse<Asset[]>>('/assets', { params });
  return response.data;
}

/**
 * getAssetById
 * ------------------------------------------------------------------
 * Fetches a single asset's full detail, including populated owner
 * info (name, email). Public endpoint.
 */
export async function getAssetById(id: string): Promise<ApiResponse<Asset>> {
  const response = await api.get<ApiResponse<Asset>>(`/assets/${id}`);
  return response.data;
}

/**
 * createAsset
 * ------------------------------------------------------------------
 * Creates a new asset listing owned by the currently authenticated
 * user. Requires a valid JWT (attached automatically by the request
 * interceptor) — the backend's `protect` middleware will reject this
 * with 401 if no valid token is present.
 */
export async function createAsset(payload: CreateAssetPayload): Promise<ApiResponse<Asset>> {
  const response = await api.post<ApiResponse<Asset>>('/assets', payload);
  return response.data;
}

/**
 * updateAsset
 * ------------------------------------------------------------------
 * Updates an existing asset's editable fields (name/description/category).
 * Backend enforces owner-only authorization (403 if the current user
 * isn't the asset's owner) — this function doesn't need to duplicate
 * that check client-side, though UI components should still hide the
 * edit action from non-owners for a good user experience.
 */
export async function updateAsset(
  id: string,
  payload: UpdateAssetPayload
): Promise<ApiResponse<Asset>> {
  const response = await api.put<ApiResponse<Asset>>(`/assets/${id}`, payload);
  return response.data;
}

/**
 * deleteAsset
 * ------------------------------------------------------------------
 * Deletes an asset. Backend enforces owner-only authorization AND
 * blocks deletion if an active (pending/approved) borrow request
 * exists on the asset (409 Conflict in that case) — this function
 * simply surfaces whatever the backend decides via getErrorMessage()
 * in the calling component.
 */
export async function deleteAsset(id: string): Promise<ApiResponse<null>> {
  const response = await api.delete<ApiResponse<null>>(`/assets/${id}`);
  return response.data;
}
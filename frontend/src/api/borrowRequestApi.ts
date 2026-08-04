import api from '@/lib/api';
import type { ApiResponse, BorrowRequest, CreateBorrowRequestPayload } from '@/types';

/**
 * borrowRequestApi.ts
 * ------------------------------------------------------------------
 * Typed wrapper functions around the shared `api` axios instance for
 * all borrow-request-related backend endpoints. Mirrors
 * backend/src/routes/borrowRequestRoutes.ts exactly:
 *
 *   POST  /api/borrow-requests               -> createBorrowRequest()
 *   GET   /api/borrow-requests/my-requests    -> getMyBorrowRequests()
 *   GET   /api/borrow-requests/incoming       -> getIncomingBorrowRequests()
 *   PATCH /api/borrow-requests/:id/approve    -> approveBorrowRequest()
 *   PATCH /api/borrow-requests/:id/reject     -> rejectBorrowRequest()
 *
 * ALL functions in this file require authentication — every route on
 * the backend is behind `router.use(protect)`. There's no public
 * borrow-request data, unlike assets which have public read endpoints.
 */

/**
 * createBorrowRequest
 * ------------------------------------------------------------------
 * Submits a new borrow request for a specific asset and date range.
 * Backend enforces (see borrowRequestController.ts):
 *   - Requester cannot be the asset's owner (403 SELF_BORROW_FORBIDDEN)
 *   - Asset must currently be 'available' (409 ASSET_NOT_AVAILABLE)
 * Both are surfaced as backend error messages via getErrorMessage()
 * in the calling component — no client-side duplication of these
 * rules needed, though the UI should still proactively hide the
 * "Request to Borrow" button on a user's own assets for good UX.
 */
export async function createBorrowRequest(
  payload: CreateBorrowRequestPayload
): Promise<ApiResponse<BorrowRequest>> {
  const response = await api.post<ApiResponse<BorrowRequest>>('/borrow-requests', payload);
  return response.data;
}

/**
 * getMyBorrowRequests
 * ------------------------------------------------------------------
 * Fetches all borrow requests made BY the current user (as requester).
 * Powers the "My Requests" page — lets a user track the status of
 * items they've asked to borrow from others.
 */
export async function getMyBorrowRequests(): Promise<ApiResponse<BorrowRequest[]>> {
  const response = await api.get<ApiResponse<BorrowRequest[]>>('/borrow-requests/my-requests');
  return response.data;
}

/**
 * getIncomingBorrowRequests
 * ------------------------------------------------------------------
 * Fetches all borrow requests made ON the current user's assets (as
 * owner). Powers the "Incoming Requests" page — where a user reviews
 * and approves/rejects requests from others wanting to borrow their items.
 */
export async function getIncomingBorrowRequests(): Promise<ApiResponse<BorrowRequest[]>> {
  const response = await api.get<ApiResponse<BorrowRequest[]>>('/borrow-requests/incoming');
  return response.data;
}

/**
 * approveBorrowRequest
 * ------------------------------------------------------------------
 * Approves a pending request. Backend cascades the underlying asset's
 * status from 'requested' -> 'borrowed' atomically. Only callable by
 * the asset's owner (403 NOT_OWNER otherwise) and only on 'pending'
 * requests (409 REQUEST_NOT_PENDING otherwise).
 */
export async function approveBorrowRequest(id: string): Promise<ApiResponse<BorrowRequest>> {
  const response = await api.patch<ApiResponse<BorrowRequest>>(`/borrow-requests/${id}/approve`);
  return response.data;
}

/**
 * rejectBorrowRequest
 * ------------------------------------------------------------------
 * Rejects a pending request. Backend cascades the underlying asset's
 * status back from 'requested' -> 'available' atomically. Same
 * owner-only and pending-only guards as approveBorrowRequest.
 */
export async function rejectBorrowRequest(id: string): Promise<ApiResponse<BorrowRequest>> {
  const response = await api.patch<ApiResponse<BorrowRequest>>(`/borrow-requests/${id}/reject`);
  return response.data;
}
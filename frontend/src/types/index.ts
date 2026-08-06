/**
 * Shared TypeScript type definitions
 * ------------------------------------------------------------------
 * Mirrors the backend's Mongoose models and API response shapes.
 * Centralizing these here means every component, hook, and API
 * function references a single source of truth for data shapes,
 * rather than redefining ad-hoc inline types across the codebase.
 *
 * IMPORTANT: These are the CLIENT-SIDE representations of backend
 * documents. MongoDB ObjectIds and Dates are serialized to strings
 * over JSON/HTTP, so fields that are `ObjectId`/`Date` in Mongoose
 * are typed as `string` here — this is a deliberate and correct
 * divergence from the backend interfaces (IUser, IAsset, IBorrowRequest),
 * not an oversight.
 */

/* ------------------------------------------------------------------ */
/* User                                                                */
/* ------------------------------------------------------------------ */

export type UserRole = 'user' | 'admin';

/**
 * User
 * ------------------------------------------------------------------
 * Represents the safe, public-facing shape of a user as returned by
 * the API. Password is NEVER included here — the backend guarantees
 * it's excluded from every response (see authController.ts / User
 * model's `select: false`), so it has no place in this client-side type.
 */
export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt?: string;
}

/* ------------------------------------------------------------------ */
/* Asset                                                               */
/* ------------------------------------------------------------------ */

export type AssetStatus = 'available' | 'requested' | 'borrowed';

/**
 * Asset
 * ------------------------------------------------------------------
 * `owner` is typed as `User | string` because the backend sometimes
 * returns it populated (full User object, e.g., on GET /assets) and
 * sometimes as a raw ObjectId string (e.g., if a future endpoint
 * returns an unpopulated asset). Components consuming `owner` must
 * narrow this type before accessing User-specific fields like
 * `owner.name` — see the `isPopulatedOwner` type guard below.
 */
export interface Asset {
  _id: string;
  name: string;
  description: string;
  category: string;
  status: AssetStatus;
  owner: User | string;
  images: string[];
  location?: AssetLocation;
  createdAt: string;
  updatedAt: string;
}

/**
 * Type guard: narrows `Asset['owner']` to a populated `User` object.
 * Use this before accessing `owner.name` / `owner.email` in components,
 * so TypeScript can verify the narrowing actually happened rather than
 * trusting an unchecked type assertion (`as User`).
 */
export function isPopulatedOwner(owner: User | string): owner is User {
  return typeof owner === 'object' && owner !== null && '_id' in owner;
}

/* ------------------------------------------------------------------ */
/* BorrowRequest                                                       */
/* ------------------------------------------------------------------ */

export type BorrowRequestStatus = 'pending' | 'approved' | 'rejected';

/**
 * BorrowRequest
 * ------------------------------------------------------------------
 * Both `asset` and `requester` follow the same populated-or-string
 * pattern as `Asset.owner` above, for the same reason (the backend
 * controller sometimes populates these relations, sometimes doesn't,
 * depending on the endpoint).
 */
export interface BorrowRequest {
  _id: string;
  asset: Asset | string;
  requester: User | string;
  startDate: string;
  endDate: string;
  status: BorrowRequestStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Type guard: narrows `BorrowRequest['asset']` to a populated `Asset`.
 */
export function isPopulatedAsset(asset: Asset | string): asset is Asset {
  return typeof asset === 'object' && asset !== null && '_id' in asset;
}

/* ------------------------------------------------------------------ */
/* API response envelopes                                              */
/* ------------------------------------------------------------------ */

/**
 * ApiResponse<T>
 * ------------------------------------------------------------------
 * Generic wrapper matching the consistent `{ success, message, data }`
 * shape every backend controller returns (see authController.ts,
 * assetController.ts, borrowRequestController.ts). Using a single
 * generic type here means every API function in the frontend gets
 * this envelope typed automatically instead of redefining it per-call.
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  count?: number; // present on list endpoints (getAssets, getMyBorrowRequests, etc.)
}

/**
 * ApiErrorResponse
 * ------------------------------------------------------------------
 * Shape of a failed API response body. Used when typing axios error
 * interceptor logic and catch blocks, so error messages extracted from
 * `error.response.data.message` are properly typed rather than `any`.
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
}

/* ------------------------------------------------------------------ */
/* Auth-specific payloads                                              */
/* ------------------------------------------------------------------ */

export interface AuthResponseData {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface CreateAssetPayload {
  name: string;
  description: string;
  category: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateAssetPayload {
  name?: string;
  description?: string;
  category?: string;
}

export interface CreateBorrowRequestPayload {
  asset: string;
  startDate: string;
  endDate: string;
}


/**
 * PaginationMeta
 * ------------------------------------------------------------------
 * Shape of the `pagination` object returned by paginated list
 * endpoints (currently just GET /api/assets). Mirrors the metadata
 * assetController.ts's getAssets computes and returns alongside `data`.
 */
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

/**
 * PaginatedApiResponse<T>
 * ------------------------------------------------------------------
 * Extends ApiResponse<T> with pagination metadata. Used specifically
 * for endpoints that paginate their results — distinct from the plain
 * ApiResponse<T> used by non-paginated list endpoints (e.g.,
 * getMyBorrowRequests, getIncomingBorrowRequests).
 */
export interface PaginatedApiResponse<T> extends ApiResponse<T> {
  pagination: PaginationMeta;
}


/**
 * AdminStats
 * ------------------------------------------------------------------
 * Shape of the platform summary returned by GET /api/admin/stats.
 */
export interface AdminStats {
  totalUsers: number;
  totalAssets: number;
  totalBorrowRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  assetsByStatus: {
    available: number;
    requested: number;
    borrowed: number;
  };
}


/**
 * AssetLocation
 * ------------------------------------------------------------------
 * Mirrors the backend's Asset.location shape. Optional — an asset
 * may have no location data at all if it was created without it.
 */
export interface AssetLocation {
  city?: string;
  coordinates?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

/**
 * NearbyAsset
 * ------------------------------------------------------------------
 * Extends Asset with the extra `distanceMeters` field that only
 * appears on results from GET /api/assets/nearby (added by the
 * backend's $geoNear aggregation stage) — not present on regular
 * getAssets() results, hence a distinct type rather than folding this
 * into the base Asset interface.
 */
export interface NearbyAsset extends Asset {
  distanceMeters: number;
}


/**
 * Conversation & Message types
 * ------------------------------------------------------------------
 * Mirror the backend's Conversation and Message models.
 */

export interface Conversation {
  _id: string;
  participants: User[];
  asset?: Pick<Asset, '_id' | 'name' | 'images'>;
  lastMessageAt: string;
  lastMessageText?: string;
  unreadCount?: number; // only present on getMyConversations results
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  _id: string;
  conversation: string;
  sender: User;
  text: string;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NewMessageSocketPayload {
  conversationId: string;
  message: ChatMessage;
}
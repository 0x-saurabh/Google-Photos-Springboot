import { useAuthStore } from "@/stores/auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

export type User = {
  id: string;
  email: string;
  displayName: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

type AuthResponsePayload = {
  access_token: string;
  refresh_token: string;
  user: User;
};

function normalizeAuthResponse(payload: AuthResponsePayload): AuthResponse {
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    user: payload.user,
  };
}

export type PhotoStatus = "ACTIVE" | "ARCHIVE" | "TRASH";

export type AiTransformType =
  | "REMOVE_BACKGROUND"
  | "BACKGROUND_AND_SHADOW"
  | "CHANGE_BACKGROUND"
  | "GENERATIVE_FILL"
  | "SMART_CROP"
  | "OBJECT_CROP"
  | "RETOUCH"
  | "UPSCALE"
  | "AI_EDIT";

export type Photo = {
  id: string;
  imagekitFileId: string;
  fileName: string;
  url: string;
  thumbnailUrl: string | null;
  mimeType: string | null;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  status: PhotoStatus;
  createdAt: string;
  deletedAt: string | null;
  parentPhotoId: string | null;
  aiTransformType: AiTransformType | null;
};

export type AiTransformRequest = {
  type: AiTransformType;
  prompt?: string;
  width?: number;
  height?: number;
  focusObject?: string;
};

export type AiTransformPreviewResponse = {
  previewUrl: string;
  type: AiTransformType;
  transformChain: string;
};

export type StorageUsageResponse = {
  libraryUsedBytes: number;
  libraryPhotoCount: number;
  imagekitBandwidthBytes: number | null;
  imagekitStorageBytes: number | null;
};

export type ImageKitAsset = {
  fileId: string;
  fileName: string;
  url: string;
  thumbnailUrl: string | null;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  alreadyImported: boolean;
};

export type Album = {
  id: string;
  title: string;
  coverPhotoId: string | null;
  coverThumbnailUrl: string | null;
  photoCount: number;
  createdAt: string;
  updatedAt: string;
};

export type UpdateAlbumRequest = {
  title?: string;
  coverPhotoId?: string;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/* ---------------------------------------------------------------------------
 * Session handling
 *
 * The backend issues short-lived access tokens (15 minutes) and rotating
 * refresh tokens. We decode the access token's `exp` claim (no verification is
 * needed for scheduling) and refresh shortly before it expires, or retry once
 * after an unauthenticated response. Refreshes are single-flight so parallel
 * requests share one call; the backend invalidates the old refresh token on use.
 * ------------------------------------------------------------------------- */

const EXPIRY_SKEW_MS = 30_000;

function decodeJwtExpiry(token: string): number | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(normalized)) as { exp?: unknown };
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

let refreshInFlight: Promise<string | null> | null = null;

function isExpiredByClock(token: string | null): boolean {
  if (!token) return true;
  const expiresAt = decodeJwtExpiry(token);
  return expiresAt !== null && expiresAt - Date.now() <= EXPIRY_SKEW_MS;
}

/**
 * Exchanges the refresh token for a new pair. Resolves to the new access token,
 * or null when the session is gone. Because the backend rotates refresh tokens,
 * a failure first checks whether another tab already refreshed and reuses that
 * session instead of signing the user out.
 */
async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const { refreshToken, setAuth, clearAuth } = useAuthStore.getState();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = normalizeAuthResponse((await response.json()) as AuthResponsePayload);
        setAuth(data);
        return data.accessToken;
      }

      if (response.status >= 500) {
        // Backend trouble, not an invalid session: keep what we have.
        return useAuthStore.getState().accessToken;
      }

      // The refresh token was rejected. Another tab may have rotated it already.
      await useAuthStore.persist?.rehydrate?.();
      const latest = useAuthStore.getState();
      if (latest.refreshToken && latest.refreshToken !== refreshToken && !isExpiredByClock(latest.accessToken)) {
        return latest.accessToken;
      }

      clearAuth();
      return null;
    } catch {
      // Network failure: keep the current session and let the caller surface the error.
      return useAuthStore.getState().accessToken;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/** Returns a usable access token, refreshing first if it is about to expire. */
export async function getValidAccessToken(): Promise<string | null> {
  const { accessToken, refreshToken } = useAuthStore.getState();
  if (!accessToken) return null;
  if (!isExpiredByClock(accessToken) || !refreshToken) return accessToken;
  return refreshAccessToken();
}

/**
 * Spring Security answers 403 both for a missing/expired token and for the
 * error dispatch of an unhandled server exception. Only treat it as an auth
 * failure when our token is actually stale; otherwise it's a server error.
 */
function looksLikeAuthFailure(status: number, tokenUsed: string | null) {
  return status === 401 || (status === 403 && isExpiredByClock(tokenUsed));
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { message?: unknown };
    if (typeof body?.message === "string" && body.message.trim()) return body.message;
  } catch {
    // ignore JSON parse errors
  }
  return fallback;
}

const SERVER_ERROR_MESSAGE = "The server couldn't complete this action. Please try again.";

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const send = async (token: string | null) => {
    const headers = new Headers(options.headers);
    if (!(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return fetch(`${API_URL}${path}`, { ...options, headers });
  };

  let token = auth ? await getValidAccessToken() : null;
  let response = await send(token);

  if (auth && looksLikeAuthFailure(response.status, token) && useAuthStore.getState().refreshToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      token = refreshed;
      response = await send(refreshed);
    }
  }

  if (!response.ok) {
    if (auth && looksLikeAuthFailure(response.status, token)) {
      useAuthStore.getState().clearAuth();
      throw new ApiError("Your session has expired. Please sign in again.", response.status);
    }
    const fallback = response.status >= 500 || response.status === 403 ? SERVER_ERROR_MESSAGE : "Request failed";
    throw new ApiError(await readErrorMessage(response, fallback), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  register: async (body: { email: string; password: string; displayName: string }) =>
    normalizeAuthResponse(
      await request<AuthResponsePayload>(
        "/auth/register",
        { method: "POST", body: JSON.stringify(body) },
        false,
      ),
    ),

  login: async (body: { email: string; password: string }) =>
    normalizeAuthResponse(
      await request<AuthResponsePayload>(
        "/auth/login",
        { method: "POST", body: JSON.stringify(body) },
        false,
      ),
    ),

  logout: () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    return request<void>(
      "/auth/logout",
      { method: "POST", body: JSON.stringify({ refreshToken }) },
      false,
    );
  },

  me: () => request<User>("/auth/me"),

  getPhoto: (photoId: string) => request<Photo>(`/photos/${photoId}`),

  getPhotos: (status: PhotoStatus = "ACTIVE", page = 0, size = 24) =>
    request<PageResponse<Photo>>(`/photos?status=${status}&page=${page}&size=${size}`),

  archivePhotos: (photoIds: string[]) =>
    request<void>("/photos/archive", { method: "POST", body: JSON.stringify({ photoIds }) }),

  trashPhotos: (photoIds: string[]) =>
    request<void>("/photos/trash", { method: "POST", body: JSON.stringify({ photoIds }) }),

  restorePhotos: (photoIds: string[]) =>
    request<void>("/photos/restore", { method: "POST", body: JSON.stringify({ photoIds }) }),

  permanentlyDeletePhotos: (photoIds: string[]) =>
    request<void>("/photos/delete-permanent", {
      method: "POST",
      body: JSON.stringify({ photoIds }),
    }),

  getAlbums: () => request<Album[]>("/albums"),

  getAlbum: (albumId: string) => request<Album>(`/albums/${albumId}`),

  createAlbum: (title: string) =>
    request<Album>("/albums", { method: "POST", body: JSON.stringify({ title }) }),

  updateAlbum: (albumId: string, body: UpdateAlbumRequest) =>
    request<Album>(`/albums/${albumId}`, { method: "PATCH", body: JSON.stringify(body) }),

  deleteAlbum: (albumId: string) =>
    request<void>(`/albums/${albumId}`, { method: "DELETE" }),

  getAlbumPhotos: (albumId: string, page = 0, size = 24) =>
    request<PageResponse<Photo>>(`/albums/${albumId}/photos?page=${page}&size=${size}`),

  addPhotosToAlbum: (albumId: string, photoIds: string[]) =>
    request<void>(`/albums/${albumId}/photos`, {
      method: "POST",
      body: JSON.stringify({ photoIds }),
    }),

  removePhotoFromAlbum: (albumId: string, photoId: string) =>
    request<void>(`/albums/${albumId}/photos/${photoId}`, { method: "DELETE" }),

  previewAiTransform: (photoId: string, body: AiTransformRequest) =>
    request<AiTransformPreviewResponse>(`/photos/${photoId}/ai/preview`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  applyAiTransform: (photoId: string, body: AiTransformRequest) =>
    request<Photo>(`/photos/${photoId}/ai/apply`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getStorageUsage: () => request<StorageUsageResponse>("/library/storage"),

  getImageKitAssets: () => request<ImageKitAsset[]>("/library/imagekit-assets"),

  importImageKitAssets: (imagekitFileIds: string[]) =>
    request<Photo[]>("/library/import", {
      method: "POST",
      body: JSON.stringify({ imagekitFileIds }),
    }),
};

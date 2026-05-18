// axios instance + interceptors backing every API call from the SPA.
//
// Auth model: Laravel Sanctum cookie auth — the host issues an `XSRF-TOKEN`
// cookie, we mirror it back in the `X-XSRF-TOKEN` header on every mutating
// request. `withCredentials: true` ensures the cookie is sent cross-origin
// when the SPA is mounted on a different origin from the API.
//
// Error model: every non-2xx response is normalised to an `ApiError`
// subclass (AuthExpiredError / FeatureDisabledError / ConfirmTokenError /
// ValidationError / generic ApiError) so TanStack Query's `onError` can
// distinguish without parsing strings.

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  ApiError,
  AuthExpiredError,
  FeatureDisabledError,
  ConfirmTokenError,
  NetworkError,
  ValidationError,
} from './errors';
import type { ApiErrorPayload, ValidationErrorPayload } from './types';

/**
 * Resolve the API base URL. Precedence (most-specific first):
 *   1. `import.meta.env.VITE_API_BASE` — build-time override (set in CI when
 *      bundling against a remote API origin).
 *   2. `window.__MCP_PACK_ADMIN__.api_base` — runtime override seeded by the
 *      Blade shell from `config('mcp-pack-admin.api_base')`.
 *   3. Hard-coded `/api/admin/mcp-pack` — matches the host's default prefix.
 */
export function apiBase(): string {
  const fromEnv =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_API_BASE
      : undefined;
  if (fromEnv) return stripTrailingSlash(fromEnv);

  const fromWindow =
    typeof window !== 'undefined'
      ? (window as { __MCP_PACK_ADMIN__?: { api_base?: string } }).__MCP_PACK_ADMIN__?.api_base
      : undefined;
  if (fromWindow) return stripTrailingSlash(fromWindow);

  return '/api/admin/mcp-pack';
}

function stripTrailingSlash(s: string): string {
  return s.replace(/\/+$/, '');
}

/**
 * Read the `XSRF-TOKEN` cookie. Laravel sets this with a URL-encoded value
 * which we must decode before echoing back as the `X-XSRF-TOKEN` header
 * (raw `%3D` padding in the header is rejected by the middleware).
 */
function readXsrfCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/**
 * Fire a global `auth:expired` CustomEvent. App.tsx listens at the shell
 * root and surfaces a toast — this keeps mutation hooks free of cross-cutting
 * concerns.
 */
function emitAuthExpired(): void {
  if (typeof document === 'undefined') return;
  try {
    document.dispatchEvent(new CustomEvent('auth:expired'));
  } catch {
    /* jsdom in older Node may not have CustomEvent — swallow */
  }
}

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);

/**
 * Create a configured axios instance. Exposed as a factory so tests can spin
 * up an isolated client against MSW handlers without sharing interceptor
 * state with the singleton.
 */
export function createApiClient(baseURL?: string): AxiosInstance {
  const client = axios.create({
    baseURL: baseURL ?? apiBase(),
    withCredentials: true,
    timeout: 30_000,
    headers: {
      Accept: 'application/json',
    },
  });

  client.interceptors.request.use((config) => {
    const method = (config.method ?? 'get').toLowerCase();
    if (MUTATING_METHODS.has(method)) {
      const xsrf = readXsrfCookie();
      if (xsrf) {
        // axios v1 ships AxiosHeaders (class) for config.headers — `set()` is
        // the canonical mutation entry-point and works on the legacy object
        // shape too via prototype lookup.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const headers = (config.headers ?? {}) as any;
        if (typeof headers.set === 'function') {
          headers.set('X-XSRF-TOKEN', xsrf);
        } else {
          headers['X-XSRF-TOKEN'] = xsrf;
        }
        config.headers = headers;
      }
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // Network-level / no-response failures.
      if (!error.response) {
        return Promise.reject(new NetworkError(error.message || 'Network error'));
      }

      const { status, data } = error.response as AxiosResponse<
        ApiErrorPayload | ValidationErrorPayload
      >;

      if (status === 401) {
        emitAuthExpired();
        return Promise.reject(new AuthExpiredError(data as ApiErrorPayload));
      }

      if (status === 403) {
        const payload = data as ApiErrorPayload;
        if (payload?.error?.code === 'feature_disabled') {
          return Promise.reject(new FeatureDisabledError(payload));
        }
        return Promise.reject(
          new ApiError(payload?.error?.message ?? 'Forbidden', 403, payload?.error?.code ?? 'forbidden', payload),
        );
      }

      if (status === 422) {
        const payload = data as ApiErrorPayload & ValidationErrorPayload;
        const code = payload?.error?.code;
        if (code === 'confirmation_invalid' || code === 'confirmation_required' || code === 'confirmation_expired') {
          return Promise.reject(new ConfirmTokenError(payload as ApiErrorPayload));
        }
        // Treat any 422 that quacks like Laravel validation as ValidationError.
        if (payload && (payload.errors || payload.message)) {
          return Promise.reject(new ValidationError(payload as ValidationErrorPayload));
        }
        return Promise.reject(
          new ApiError(payload?.error?.message ?? 'Unprocessable entity', 422, payload?.error?.code ?? 'unprocessable', payload),
        );
      }

      const payload = data as ApiErrorPayload;
      return Promise.reject(
        new ApiError(
          payload?.error?.message ?? `Request failed with status ${status}`,
          status,
          payload?.error?.code ?? `http_${status}`,
          payload,
        ),
      );
    },
  );

  return client;
}

// Default singleton client used by every endpoint helper. Tests can override
// by calling `setApiClient(createApiClient('http://localhost/...'))`.
let _client: AxiosInstance = createApiClient();

export function getApiClient(): AxiosInstance {
  return _client;
}

export function setApiClient(client: AxiosInstance): void {
  _client = client;
}

/**
 * Thin typed wrapper that returns `response.data` directly. Use this when
 * the endpoint helper has nothing custom to do beyond passing through the
 * payload.
 */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await getApiClient().request<T>(config);
  return response.data;
}

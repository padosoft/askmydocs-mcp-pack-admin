// Typed error hierarchy thrown by the axios client. TanStack Query's onError
// receives one of these whenever an endpoint call fails; the UI distinguishes
// the error variants by `instanceof` (not by string matching).
//
// R14 — surface failures loudly. Never return success-shaped objects from
// the client when the server reported a failure.

import type { ApiErrorPayload, ValidationErrorPayload } from './types';

/**
 * Base class for every error originating from the API client. Carries the
 * HTTP status and the original wire payload (if any) so the UI can inspect
 * `error.payload?.error?.code` etc. without parsing strings.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly payload: ApiErrorPayload | ValidationErrorPayload | null;

  constructor(
    message: string,
    status: number,
    code: string,
    payload: ApiErrorPayload | ValidationErrorPayload | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

/**
 * Network-level error (no HTTP status — DNS failure, connection refused,
 * CORS preflight rejection). status is 0 by convention.
 */
export class NetworkError extends ApiError {
  constructor(message: string) {
    super(message, 0, 'network_error', null);
    this.name = 'NetworkError';
  }
}

/**
 * 401 — the host session expired. The interceptor ALSO fires a global
 * `auth:expired` CustomEvent so App.tsx can surface a "session expired" toast
 * without every mutation having to wire its own onError handler.
 */
export class AuthExpiredError extends ApiError {
  constructor(payload: ApiErrorPayload | null = null) {
    super(
      payload?.error?.message ?? 'Your session has expired. Please reload.',
      401,
      payload?.error?.code ?? 'unauthenticated',
      payload,
    );
    this.name = 'AuthExpiredError';
  }
}

/**
 * 403 with `error.code === 'feature_disabled'` — the host has switched off
 * the SPA route (`mcp-pack.admin.enabled = false` or a per-route feature
 * toggle). Rendered as an empty-state, not a flash error.
 */
export class FeatureDisabledError extends ApiError {
  constructor(payload: ApiErrorPayload | null = null) {
    super(
      payload?.error?.message ?? 'This feature has been disabled by the host operator.',
      403,
      payload?.error?.code ?? 'feature_disabled',
      payload,
    );
    this.name = 'FeatureDisabledError';
  }
}

/**
 * 422 with `error.code === 'confirmation_invalid'` or `'confirmation_required'`
 * — the second leg of the two-call confirm-token protocol failed (expired,
 * mismatched payload, or never minted in the first place).
 *
 * `confirmTokenMint` is populated when the 202 first-leg response carried a
 * fresh token the UI should prompt the operator to confirm.
 */
export class ConfirmTokenError extends ApiError {
  public readonly reason: 'required' | 'invalid' | 'expired';
  public readonly confirmTokenMint: {
    confirm_token?: string;
    expires_in?: number;
  } | null;

  constructor(
    payload: ApiErrorPayload | null = null,
    confirmTokenMint: { confirm_token?: string; expires_in?: number } | null = null,
  ) {
    const code = payload?.error?.code ?? 'confirmation_required';
    const reason =
      code === 'confirmation_invalid'
        ? 'invalid'
        : code === 'confirmation_expired'
        ? 'expired'
        : 'required';

    super(
      payload?.error?.message ?? 'A confirmation token is required for this destructive action.',
      422,
      code,
      payload,
    );
    this.name = 'ConfirmTokenError';
    this.reason = reason;
    this.confirmTokenMint = confirmTokenMint;
  }
}

/**
 * 422 with a Laravel validation envelope (`{ message, errors: { field: [...] } }`).
 * Form components inspect `error.fieldErrors` to pin the message next to
 * each input.
 */
export class ValidationError extends ApiError {
  public readonly fieldErrors: Record<string, string[]>;

  constructor(payload: ValidationErrorPayload | null) {
    const fieldErrors = payload?.errors ?? {};
    super(payload?.message ?? 'Validation failed.', 422, 'validation_failed', payload);
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

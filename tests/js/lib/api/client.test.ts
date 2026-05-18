import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from './server';
import {
  apiBase,
  createApiClient,
  getApiClient,
  setApiClient,
} from '../../../../resources/js/lib/api/client';
import {
  ApiError,
  AuthExpiredError,
  ConfirmTokenError,
  FeatureDisabledError,
  NetworkError,
  ValidationError,
} from '../../../../resources/js/lib/api/errors';

const BASE = 'http://127.0.0.1/api/admin/mcp-pack';

beforeEach(() => {
  // Reset the singleton client between tests so interceptor mutations don't
  // leak across files. Re-create against the canonical test base URL.
  setApiClient(createApiClient(BASE));
  // Iter-2 fix: `document.cookie = ''` is silently ignored in jsdom
  // (it tries to set a cookie with empty name + value); the
  // previously-set `XSRF-TOKEN` cookie would persist into the next
  // test, making order-dependent failures. Explicitly expire the
  // cookies we set in this suite by writing `key=; Max-Age=0; path=/`.
  document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
});

describe('apiBase()', () => {
  it('resolves from window.__MCP_PACK_ADMIN__.api_base', () => {
    expect(apiBase()).toBe(BASE);
  });

  it('strips trailing slashes', () => {
    (window as any).__MCP_PACK_ADMIN__ = { api_base: 'http://example.test/api/' };
    expect(apiBase()).toBe('http://example.test/api');
    (window as any).__MCP_PACK_ADMIN__ = { api_base: BASE };
  });
});

describe('request interceptor — X-XSRF-TOKEN', () => {
  it('echoes XSRF-TOKEN cookie back as X-XSRF-TOKEN on POST', async () => {
    document.cookie = 'XSRF-TOKEN=test-csrf-value';
    let received: string | null = null;
    server.use(
      http.post(`${BASE}/api-keys`, ({ request }) => {
        received = request.headers.get('X-XSRF-TOKEN');
        return HttpResponse.json({ data: { id: 'k1', name: 'n', scopes: [], created_at: 0 } }, { status: 201 });
      }),
    );

    await getApiClient().post('/api-keys', { name: 'n', scopes: ['x'] });
    expect(received).toBe('test-csrf-value');
  });

  it('does NOT set X-XSRF-TOKEN on GET', async () => {
    document.cookie = 'XSRF-TOKEN=should-not-echo';
    let received: string | null | undefined = undefined;
    server.use(
      http.get(`${BASE}/me`, ({ request }) => {
        received = request.headers.get('X-XSRF-TOKEN');
        return HttpResponse.json({ data: { id: 1 } });
      }),
    );

    await getApiClient().get('/me');
    expect(received).toBeNull();
  });

  it('URL-decodes the XSRF-TOKEN cookie before echoing', async () => {
    document.cookie = `XSRF-TOKEN=${encodeURIComponent('value+with/slash==')}`;
    let received: string | null = null;
    server.use(
      http.delete(`${BASE}/api-keys/abc`, ({ request }) => {
        received = request.headers.get('X-XSRF-TOKEN');
        return HttpResponse.json({}, { status: 200 });
      }),
    );

    await getApiClient().delete('/api-keys/abc');
    expect(received).toBe('value+with/slash==');
  });
});

describe('response interceptor — error mapping', () => {
  it('401 → AuthExpiredError + fires auth:expired CustomEvent', async () => {
    server.use(
      http.get(`${BASE}/me`, () =>
        HttpResponse.json({ error: { code: 'unauthenticated', message: 'session expired' } }, { status: 401 }),
      ),
    );

    const listener = vi.fn();
    document.addEventListener('auth:expired', listener);

    await expect(getApiClient().get('/me')).rejects.toBeInstanceOf(AuthExpiredError);
    expect(listener).toHaveBeenCalledTimes(1);

    document.removeEventListener('auth:expired', listener);
  });

  it('403 with code=feature_disabled → FeatureDisabledError', async () => {
    server.use(
      http.get(`${BASE}/servers`, () =>
        HttpResponse.json(
          { error: { code: 'feature_disabled', message: 'admin SPA disabled' } },
          { status: 403 },
        ),
      ),
    );
    await expect(getApiClient().get('/servers')).rejects.toBeInstanceOf(FeatureDisabledError);
  });

  it('403 with a generic code → plain ApiError (not FeatureDisabledError)', async () => {
    server.use(
      http.get(`${BASE}/servers`, () =>
        HttpResponse.json({ error: { code: 'forbidden', message: 'nope' } }, { status: 403 }),
      ),
    );

    const err = await getApiClient()
      .get('/servers')
      .catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).not.toBeInstanceOf(FeatureDisabledError);
    expect(err.status).toBe(403);
  });

  it('422 with code=confirmation_invalid → ConfirmTokenError', async () => {
    server.use(
      http.post(`${BASE}/audit/aud_1/replay`, () =>
        HttpResponse.json(
          { error: { code: 'confirmation_invalid', message: 'bad token' } },
          { status: 422 },
        ),
      ),
    );

    const err = await getApiClient()
      .post('/audit/aud_1/replay', { confirm_token: 'bad' })
      .catch((e) => e);
    expect(err).toBeInstanceOf(ConfirmTokenError);
    expect((err as ConfirmTokenError).reason).toBe('invalid');
  });

  it('422 with Laravel validation envelope → ValidationError', async () => {
    server.use(
      http.post(`${BASE}/api-keys`, () =>
        HttpResponse.json(
          { message: 'The given data was invalid.', errors: { name: ['required'] } },
          { status: 422 },
        ),
      ),
    );

    const err = await getApiClient()
      .post('/api-keys', {})
      .catch((e) => e);
    expect(err).toBeInstanceOf(ValidationError);
    expect((err as ValidationError).fieldErrors).toEqual({ name: ['required'] });
  });

  it('network error (no response) → NetworkError', async () => {
    server.use(
      http.get(`${BASE}/me`, () => HttpResponse.error()),
    );

    const err = await getApiClient()
      .get('/me')
      .catch((e) => e);
    expect(err).toBeInstanceOf(NetworkError);
    expect(err.status).toBe(0);
  });

  it('generic 5xx → ApiError with carried status', async () => {
    server.use(
      http.get(`${BASE}/me`, () =>
        HttpResponse.json({ error: { code: 'server_error', message: 'boom' } }, { status: 503 }),
      ),
    );

    const err = await getApiClient()
      .get('/me')
      .catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(503);
    expect((err as ApiError).code).toBe('server_error');
  });
});

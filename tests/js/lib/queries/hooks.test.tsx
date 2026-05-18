import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../api/server';
import { createApiClient, setApiClient } from '../../../../resources/js/lib/api/client';
import {
  useMe,
  useTenants,
  useApiKeys,
  useServers,
  useServer,
  useTools,
  useAudit,
  useBreakers,
} from '../../../../resources/js/lib/queries/hooks';
import { withQueryClient } from './wrapper';

const BASE = 'http://127.0.0.1/api/admin/mcp-pack';

beforeEach(() => {
  setApiClient(createApiClient(BASE));
});

describe('Read hooks — happy path', () => {
  it('useMe — loading → success', async () => {
    server.use(
      http.get(`${BASE}/me`, () => HttpResponse.json({ data: { id: 1, email: 'a@b' } })),
    );
    const { result } = renderHook(() => useMe(), { wrapper: withQueryClient() });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data.email).toBe('a@b');
  });

  it('useTenants — returns the unwrapped array', async () => {
    server.use(
      http.get(`${BASE}/tenants`, () =>
        HttpResponse.json({ data: [{ id: 't1', name: 'T' }] }),
      ),
    );
    const { result } = renderHook(() => useTenants(), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 't1', name: 'T' }]);
  });

  it('useApiKeys — returns the unwrapped array', async () => {
    server.use(
      http.get(`${BASE}/api-keys`, () =>
        HttpResponse.json({ data: [{ id: 'k1', name: 'n', scopes: [], created_at: 0 }] }),
      ),
    );
    const { result } = renderHook(() => useApiKeys(), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });

  it('useServers — forwards filters as query params', async () => {
    let qs: URLSearchParams | null = null;
    server.use(
      http.get(`${BASE}/servers`, ({ request }) => {
        qs = new URL(request.url).searchParams;
        return HttpResponse.json({ data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } });
      }),
    );
    const { result } = renderHook(() => useServers({ q: 'xx' }), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(qs!.get('q')).toBe('xx');
  });

  it('useServer — disabled when id is empty', () => {
    const { result } = renderHook(() => useServer(undefined), { wrapper: withQueryClient() });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('useTools — flat list', async () => {
    server.use(
      http.get(`${BASE}/tools`, () =>
        HttpResponse.json({ data: [{ server_id: 'a', name: 'x' }] }),
      ),
    );
    const { result } = renderHook(() => useTools(), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });

  it('useAudit — passes filters', async () => {
    let qs: URLSearchParams | null = null;
    server.use(
      http.get(`${BASE}/audit`, ({ request }) => {
        qs = new URL(request.url).searchParams;
        return HttpResponse.json({ data: [] });
      }),
    );
    const { result } = renderHook(() => useAudit({ status: 'err' }), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(qs!.get('status')).toBe('err');
  });

  it('useBreakers — list', async () => {
    server.use(
      http.get(`${BASE}/circuit-breaker`, () =>
        HttpResponse.json({ data: [{ key: 'k1', state: 'closed' }] }),
      ),
    );
    const { result } = renderHook(() => useBreakers(), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].key).toBe('k1');
  });
});

describe('Read hooks — failure path', () => {
  it('useMe — surfaces error when API returns 500', async () => {
    server.use(
      http.get(`${BASE}/me`, () =>
        HttpResponse.json({ error: { code: 'server_error', message: 'boom' } }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useMe(), { wrapper: withQueryClient() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toMatch(/boom|server/i);
  });
});

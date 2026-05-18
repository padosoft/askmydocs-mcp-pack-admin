import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../api/server';
import { createApiClient, setApiClient } from '../../../../resources/js/lib/api/client';
import { ConfirmTokenError } from '../../../../resources/js/lib/api/errors';
import {
  useCreateApiKey,
  useRevokeApiKey,
  useCreateServer,
  useInvokeTool,
  useReplayAudit,
  useResetBreaker,
  useUpdateServer,
  useHandshake,
} from '../../../../resources/js/lib/mutations/hooks';
import { withQueryClient } from '../queries/wrapper';

const BASE = 'http://127.0.0.1/api/admin/mcp-pack';

beforeEach(() => {
  setApiClient(createApiClient(BASE));
});

describe('Identity mutations', () => {
  it('useCreateApiKey — returns the plaintext envelope', async () => {
    server.use(
      http.post(`${BASE}/api-keys`, () =>
        HttpResponse.json(
          { data: { id: 'k1', name: 'n', scopes: ['s'], created_at: 0, plaintext: 'pk_x' } },
          { status: 201 },
        ),
      ),
    );

    const { result } = renderHook(() => useCreateApiKey(), { wrapper: withQueryClient() });
    let envelope;
    await act(async () => {
      envelope = await result.current.mutateAsync({ name: 'n', scopes: ['s'] });
    });
    expect((envelope as any).data.plaintext).toBe('pk_x');
  });

  it('useRevokeApiKey — fires DELETE', async () => {
    let called = false;
    server.use(
      http.delete(`${BASE}/api-keys/k1`, () => {
        called = true;
        return HttpResponse.json({}, { status: 200 });
      }),
    );

    const { result } = renderHook(() => useRevokeApiKey(), { wrapper: withQueryClient() });
    await act(async () => {
      await result.current.mutateAsync('k1');
    });
    expect(called).toBe(true);
  });
});

describe('Server mutations', () => {
  it('useCreateServer — POST /servers', async () => {
    server.use(
      http.post(`${BASE}/servers`, () =>
        HttpResponse.json({ data: { id: 'srv_x', name: 'new', transport: 'http' } }, { status: 201 }),
      ),
    );
    const { result } = renderHook(() => useCreateServer(), { wrapper: withQueryClient() });
    let created;
    await act(async () => {
      created = await result.current.mutateAsync({ name: 'new', transport: 'http' });
    });
    expect((created as any).id).toBe('srv_x');
  });

  it('useUpdateServer — PATCH /servers/{id}', async () => {
    let body: unknown = null;
    server.use(
      http.patch(`${BASE}/servers/srv_x`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({}, { status: 200 });
      }),
    );
    const { result } = renderHook(() => useUpdateServer(), { wrapper: withQueryClient() });
    await act(async () => {
      await result.current.mutateAsync({ id: 'srv_x', patch: { enabled: true } });
    });
    expect(body).toEqual({ enabled: true });
  });

  it('useHandshake — POST /servers/{id}/handshake', async () => {
    let called = false;
    server.use(
      http.post(`${BASE}/servers/srv_x/handshake`, () => {
        called = true;
        return HttpResponse.json({}, { status: 200 });
      }),
    );
    const { result } = renderHook(() => useHandshake(), { wrapper: withQueryClient() });
    await act(async () => {
      await result.current.mutateAsync('srv_x');
    });
    expect(called).toBe(true);
  });
});

describe('Destructive mutations — confirm-token protocol', () => {
  it('useInvokeTool — first call surfaces a ConfirmTokenError carrying the minted token', async () => {
    server.use(
      http.post(`${BASE}/servers/srv_x/tools/delete-all/invoke`, () =>
        HttpResponse.json({ confirm_token: 'xt_abc', expires_in: 60 }, { status: 202 }),
      ),
    );

    const { result } = renderHook(() => useInvokeTool(), { wrapper: withQueryClient() });
    let caught: unknown = null;
    await act(async () => {
      try {
        await result.current.mutateAsync({ serverId: 'srv_x', toolName: 'delete-all' });
      } catch (e) {
        caught = e;
      }
    });
    expect(caught).toBeInstanceOf(ConfirmTokenError);
    expect((caught as ConfirmTokenError).confirmTokenMint?.confirm_token).toBe('xt_abc');
  });

  it('useInvokeTool — second call with token returns the result', async () => {
    server.use(
      http.post(`${BASE}/servers/srv_x/tools/delete-all/invoke`, () =>
        HttpResponse.json({ result: 'deleted' }),
      ),
    );
    const { result } = renderHook(() => useInvokeTool(), { wrapper: withQueryClient() });
    let res;
    await act(async () => {
      res = await result.current.mutateAsync({
        serverId: 'srv_x',
        toolName: 'delete-all',
        confirmToken: 'xt_abc',
      });
    });
    expect(res).toEqual({ result: 'deleted' });
  });

  it('useReplayAudit — first call throws ConfirmTokenError', async () => {
    server.use(
      http.post(`${BASE}/audit/aud_1/replay`, () =>
        HttpResponse.json({ confirm_token: 'rt_1' }, { status: 202 }),
      ),
    );
    const { result } = renderHook(() => useReplayAudit(), { wrapper: withQueryClient() });
    let caught: unknown = null;
    await act(async () => {
      try {
        await result.current.mutateAsync({ id: 'aud_1' });
      } catch (e) {
        caught = e;
      }
    });
    expect(caught).toBeInstanceOf(ConfirmTokenError);
  });

  it('useResetBreaker — first call throws ConfirmTokenError, second resolves', async () => {
    let secondCallSeen = false;
    server.use(
      http.post(`${BASE}/circuit-breaker/srv_x%3Atool/reset`, async ({ request }) => {
        const body = (await request.json().catch(() => null)) as { confirm_token?: string } | null;
        if (body?.confirm_token === 'br_1') {
          secondCallSeen = true;
          return HttpResponse.json({}, { status: 200 });
        }
        return HttpResponse.json({ confirm_token: 'br_1' }, { status: 202 });
      }),
    );

    const { result } = renderHook(() => useResetBreaker(), { wrapper: withQueryClient() });

    let firstErr: unknown = null;
    await act(async () => {
      try {
        await result.current.mutateAsync({ key: 'srv_x:tool' });
      } catch (e) {
        firstErr = e;
      }
    });
    expect(firstErr).toBeInstanceOf(ConfirmTokenError);

    await act(async () => {
      await result.current.mutateAsync({ key: 'srv_x:tool', confirmToken: 'br_1' });
    });
    expect(secondCallSeen).toBe(true);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from './server';
import { createApiClient, setApiClient } from '../../../../resources/js/lib/api/client';
import * as api from '../../../../resources/js/lib/api/endpoints';
import { ConfirmTokenError } from '../../../../resources/js/lib/api/errors';

const BASE = 'http://127.0.0.1/api/admin/mcp-pack';

beforeEach(() => {
  setApiClient(createApiClient(BASE));
});

describe('Identity endpoints', () => {
  it('fetchMe → GET /me', async () => {
    server.use(
      http.get(`${BASE}/me`, () =>
        HttpResponse.json({ data: { id: 1, email: 'a@b.c' }, meta: { tenant_id: 't1' } }),
      ),
    );
    const res = await api.fetchMe();
    expect(res.data.email).toBe('a@b.c');
    expect(res.meta?.tenant_id).toBe('t1');
  });

  it('updatePreferences → POST /me/preferences with body', async () => {
    let body: unknown = null;
    server.use(
      http.post(`${BASE}/me/preferences`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({}, { status: 200 });
      }),
    );
    await api.updatePreferences({ preferences: { theme: 'dark' } });
    expect(body).toEqual({ preferences: { theme: 'dark' } });
  });

  it('listTenants → GET /tenants', async () => {
    server.use(
      http.get(`${BASE}/tenants`, () =>
        HttpResponse.json({ data: [{ id: 't1', name: 'Tenant 1' }] }),
      ),
    );
    const tenants = await api.listTenants();
    expect(tenants).toHaveLength(1);
    expect(tenants[0].id).toBe('t1');
  });

  it('createApiKey → POST /api-keys', async () => {
    server.use(
      http.post(`${BASE}/api-keys`, async ({ request }) => {
        const body = (await request.json()) as { name: string; scopes: string[] };
        return HttpResponse.json(
          {
            data: {
              id: 'k1',
              name: body.name,
              scopes: body.scopes,
              created_at: 0,
              plaintext: 'pk_test_xxx',
            },
          },
          { status: 201 },
        );
      }),
    );
    const env = await api.createApiKey({ name: 'CI key', scopes: ['mcp.invoke'] });
    expect(env.data.plaintext).toBe('pk_test_xxx');
    expect(env.data.name).toBe('CI key');
  });

  it('revokeApiKey → DELETE /api-keys/{id} with encoded segment', async () => {
    let url: string | null = null;
    server.use(
      http.delete(`${BASE}/api-keys/:id`, ({ request }) => {
        url = new URL(request.url).pathname;
        return HttpResponse.json({}, { status: 200 });
      }),
    );
    await api.revokeApiKey('key with spaces/and-slash');
    expect(url).toContain(encodeURIComponent('key with spaces/and-slash'));
  });
});

describe('Servers endpoints', () => {
  it('listServers → GET /servers with query params', async () => {
    let params: URLSearchParams | null = null;
    server.use(
      http.get(`${BASE}/servers`, ({ request }) => {
        params = new URL(request.url).searchParams;
        return HttpResponse.json({ data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } });
      }),
    );

    await api.listServers({ q: 'gpt', status: 'ok', page: 2, per_page: 50 });
    expect(params!.get('q')).toBe('gpt');
    expect(params!.get('status')).toBe('ok');
    expect(params!.get('page')).toBe('2');
    expect(params!.get('per_page')).toBe('50');
  });

  it('getServer → GET /servers/{id}', async () => {
    server.use(
      http.get(`${BASE}/servers/srv_01`, () =>
        HttpResponse.json({ data: { id: 'srv_01', name: 'openai', transport: 'http' } }),
      ),
    );
    const s = await api.getServer('srv_01');
    expect(s.id).toBe('srv_01');
  });

  it('createServer → POST /servers', async () => {
    server.use(
      http.post(`${BASE}/servers`, async ({ request }) => {
        const body = (await request.json()) as { name: string; transport: string };
        return HttpResponse.json(
          { data: { id: 'srv_99', name: body.name, transport: body.transport } },
          { status: 201 },
        );
      }),
    );
    const s = await api.createServer({ name: 'new', transport: 'http' });
    expect(s.id).toBe('srv_99');
  });

  it('updateServer → PATCH /servers/{id} carries the patch body', async () => {
    let body: unknown = null;
    server.use(
      http.patch(`${BASE}/servers/srv_01`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({}, { status: 200 });
      }),
    );
    await api.updateServer('srv_01', { enabled: false });
    expect(body).toEqual({ enabled: false });
  });

  it('deleteServer → DELETE /servers/{id}', async () => {
    let called = false;
    server.use(
      http.delete(`${BASE}/servers/srv_01`, () => {
        called = true;
        return HttpResponse.json({}, { status: 200 });
      }),
    );
    await api.deleteServer('srv_01');
    expect(called).toBe(true);
  });

  it('handshakeServer → POST /servers/{id}/handshake', async () => {
    let called = false;
    server.use(
      http.post(`${BASE}/servers/srv_01/handshake`, () => {
        called = true;
        return HttpResponse.json({}, { status: 200 });
      }),
    );
    await api.handshakeServer('srv_01');
    expect(called).toBe(true);
  });

  it('listServerTools → GET /servers/{id}/tools', async () => {
    server.use(
      http.get(`${BASE}/servers/srv_01/tools`, () =>
        HttpResponse.json({ data: [{ server_id: 'srv_01', name: 'chat' }] }),
      ),
    );
    const tools = await api.listServerTools('srv_01');
    expect(tools[0].name).toBe('chat');
  });
});

describe('Tools endpoints', () => {
  it('listTools → GET /tools (flat)', async () => {
    server.use(
      http.get(`${BASE}/tools`, () =>
        HttpResponse.json({ data: [{ server_id: 'a', name: 'x' }, { server_id: 'b', name: 'y' }] }),
      ),
    );
    expect(await api.listTools()).toHaveLength(2);
  });

  it('invokeTool — 200 returns body', async () => {
    server.use(
      http.post(`${BASE}/servers/srv_01/tools/chat/invoke`, () =>
        HttpResponse.json({ result: 'ok' }),
      ),
    );
    const res = await api.invokeTool('srv_01', 'chat', { msg: 'hi' });
    expect(res).toEqual({ result: 'ok' });
  });

  it('invokeTool — 202 throws ConfirmTokenError carrying the minted token', async () => {
    server.use(
      http.post(`${BASE}/servers/srv_01/tools/delete-all/invoke`, () =>
        HttpResponse.json({ confirm_token: 'xt_abc', expires_in: 60 }, { status: 202 }),
      ),
    );
    const err = await api.invokeTool('srv_01', 'delete-all').catch((e) => e);
    expect(err).toBeInstanceOf(ConfirmTokenError);
    expect((err as ConfirmTokenError).confirmTokenMint?.confirm_token).toBe('xt_abc');
  });

  it('invokeTool — second call with token returns 200', async () => {
    let receivedBody: unknown = null;
    server.use(
      http.post(`${BASE}/servers/srv_01/tools/delete-all/invoke`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ result: 'deleted' });
      }),
    );
    const res = await api.invokeTool('srv_01', 'delete-all', { force: true }, 'xt_abc');
    expect(receivedBody).toEqual({ force: true, confirm_token: 'xt_abc' });
    expect(res).toEqual({ result: 'deleted' });
  });
});

describe('Resources + Prompts', () => {
  it('listResources → GET /servers/{id}/resources', async () => {
    server.use(
      http.get(`${BASE}/servers/srv_01/resources`, () =>
        HttpResponse.json({
          data: [{ uri: 'mcp://a', name: 'a', type: 'file' }],
        }),
      ),
    );
    const r = await api.listResources('srv_01');
    expect(r[0].uri).toBe('mcp://a');
  });

  it('getResource — URI is URL-encoded into the path', async () => {
    let path: string | null = null;
    server.use(
      http.get(`${BASE}/servers/srv_01/resources/:uri`, ({ request }) => {
        path = new URL(request.url).pathname;
        return HttpResponse.json({ data: { uri: 'mcp://docs/readme.md', name: 'readme', content: 'hello' } });
      }),
    );
    await api.getResource('srv_01', 'mcp://docs/readme.md');
    expect(path).toContain(encodeURIComponent('mcp://docs/readme.md'));
  });

  it('listPrompts → GET /servers/{id}/prompts', async () => {
    server.use(
      http.get(`${BASE}/servers/srv_01/prompts`, () =>
        HttpResponse.json({ data: [{ name: 'greet', args: [], preview: [] }] }),
      ),
    );
    const p = await api.listPrompts('srv_01');
    expect(p[0].name).toBe('greet');
  });

  it('getPrompt → GET /servers/{id}/prompts/{name}', async () => {
    server.use(
      http.get(`${BASE}/servers/srv_01/prompts/greet`, () =>
        HttpResponse.json({ data: { name: 'greet', args: [], preview: [] } }),
      ),
    );
    const p = await api.getPrompt('srv_01', 'greet');
    expect(p.name).toBe('greet');
  });
});

describe('Audit + Resilience', () => {
  it('listAudit → GET /audit with filters', async () => {
    let qs: URLSearchParams | null = null;
    server.use(
      http.get(`${BASE}/audit`, ({ request }) => {
        qs = new URL(request.url).searchParams;
        return HttpResponse.json({ data: [] });
      }),
    );
    await api.listAudit({ server_id: 'srv_01', status: 'err' });
    expect(qs!.get('server_id')).toBe('srv_01');
    expect(qs!.get('status')).toBe('err');
  });

  it('getAudit → GET /audit/{id}', async () => {
    server.use(
      http.get(`${BASE}/audit/aud_1`, () =>
        HttpResponse.json({ data: { id: 'aud_1', mcp_server_id: 's', tool_name: 't', status: 'ok' } }),
      ),
    );
    const d = await api.getAudit('aud_1');
    expect(d.id).toBe('aud_1');
  });

  it('replayAudit — 202 throws ConfirmTokenError', async () => {
    server.use(
      http.post(`${BASE}/audit/aud_1/replay`, () =>
        HttpResponse.json({ confirm_token: 'rt_1' }, { status: 202 }),
      ),
    );
    const err = await api.replayAudit('aud_1').catch((e) => e);
    expect(err).toBeInstanceOf(ConfirmTokenError);
  });

  it('replayAudit — second call with token resolves', async () => {
    let body: unknown = null;
    server.use(
      http.post(`${BASE}/audit/aud_1/replay`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ok: true });
      }),
    );
    const res = await api.replayAudit('aud_1', 'rt_1');
    expect(body).toEqual({ confirm_token: 'rt_1' });
    expect(res).toEqual({ ok: true });
  });

  it('listBreakers → GET /circuit-breaker', async () => {
    server.use(
      http.get(`${BASE}/circuit-breaker`, () =>
        HttpResponse.json({ data: [{ key: 'srv_01/x', state: 'closed' }] }),
      ),
    );
    const b = await api.listBreakers();
    expect(b[0].key).toBe('srv_01/x');
  });

  it('resetBreaker — 202 throws ConfirmTokenError', async () => {
    server.use(
      http.post(`${BASE}/circuit-breaker/srv_01:tool_x/reset`, () =>
        HttpResponse.json({ confirm_token: 'br_1', expires_in: 30 }, { status: 202 }),
      ),
    );
    const err = await api.resetBreaker('srv_01:tool_x').catch((e) => e);
    expect(err).toBeInstanceOf(ConfirmTokenError);
    expect((err as ConfirmTokenError).confirmTokenMint?.confirm_token).toBe('br_1');
  });

  it('resetBreaker — second call with token resolves to void', async () => {
    let body: unknown = null;
    server.use(
      http.post(`${BASE}/circuit-breaker/srv_01:tool_x/reset`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({}, { status: 200 });
      }),
    );
    await api.resetBreaker('srv_01:tool_x', 'br_1');
    expect(body).toEqual({ confirm_token: 'br_1' });
  });
});

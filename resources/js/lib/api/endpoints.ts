// One typed async function per OpenAPI endpoint. Every function:
//   - returns the wire payload `data` (envelope-unwrapped where the OpenAPI
//     spec wraps the resource in `{ data: ... }`)
//   - URL-encodes every dynamic path segment via `encodeURIComponent`
//     (R19 — never string-concatenate user input)
//   - never sets `X-Tenant-Id` (R30 — the host middleware owns tenant
//     resolution)
//
// Callers consume these via the TanStack Query hooks in
// `resources/js/lib/queries/` and `resources/js/lib/mutations/`. Direct
// imports are fine for unit tests but not for components.

import { request, getApiClient } from './client';
import { ConfirmTokenError } from './errors';
import type {
  AuditDetail,
  AuditEvent,
  AuditListFilters,
  AuditRow,
  BreakerState,
  CreateApiKeyRequest,
  HostApiKey,
  HostApiKeyCreateEnvelope,
  HostTenant,
  HostUser,
  HostUserEnvelope,
  ListEnvelope,
  McpServer,
  McpServerEnvelope,
  McpServerPage,
  McpServerWrite,
  Prompt,
  Resource,
  ResourceContent,
  ResourceContentEnvelope,
  ServerListFilters,
  Tool,
  ToolInvokeResult,
  UpdatePreferencesRequest,
} from './types';

// --------------------------------------------------------------------- //
// Identity
// --------------------------------------------------------------------- //

export async function fetchMe(): Promise<HostUserEnvelope> {
  return request<HostUserEnvelope>({ method: 'get', url: '/me' });
}

export async function updatePreferences(payload: UpdatePreferencesRequest): Promise<void> {
  await request<void>({ method: 'post', url: '/me/preferences', data: payload });
}

export async function listTenants(): Promise<HostTenant[]> {
  const res = await request<ListEnvelope<HostTenant>>({ method: 'get', url: '/tenants' });
  return res.data ?? [];
}

export async function listApiKeys(): Promise<HostApiKey[]> {
  const res = await request<ListEnvelope<HostApiKey>>({ method: 'get', url: '/api-keys' });
  return res.data ?? [];
}

export async function createApiKey(payload: CreateApiKeyRequest): Promise<HostApiKeyCreateEnvelope> {
  return request<HostApiKeyCreateEnvelope>({ method: 'post', url: '/api-keys', data: payload });
}

export async function revokeApiKey(id: string): Promise<void> {
  await request<void>({ method: 'delete', url: `/api-keys/${encodeURIComponent(id)}` });
}

// --------------------------------------------------------------------- //
// Servers
// --------------------------------------------------------------------- //

export async function listServers(filters: ServerListFilters = {}): Promise<McpServerPage> {
  return request<McpServerPage>({ method: 'get', url: '/servers', params: filters });
}

export async function getServer(id: string): Promise<McpServer> {
  const res = await request<McpServerEnvelope>({
    method: 'get',
    url: `/servers/${encodeURIComponent(id)}`,
  });
  return res.data;
}

export async function createServer(body: McpServerWrite): Promise<McpServer> {
  const res = await request<McpServerEnvelope>({ method: 'post', url: '/servers', data: body });
  return res.data;
}

export async function updateServer(id: string, patch: Partial<McpServerWrite>): Promise<void> {
  await request<void>({
    method: 'patch',
    url: `/servers/${encodeURIComponent(id)}`,
    data: patch,
  });
}

export async function deleteServer(id: string): Promise<void> {
  await request<void>({ method: 'delete', url: `/servers/${encodeURIComponent(id)}` });
}

export async function handshakeServer(id: string): Promise<void> {
  await request<void>({ method: 'post', url: `/servers/${encodeURIComponent(id)}/handshake` });
}

export async function listServerTools(id: string): Promise<Tool[]> {
  const res = await request<ListEnvelope<Tool>>({
    method: 'get',
    url: `/servers/${encodeURIComponent(id)}/tools`,
  });
  return res.data ?? [];
}

// --------------------------------------------------------------------- //
// Tools
// --------------------------------------------------------------------- //

export async function listTools(): Promise<Tool[]> {
  const res = await request<ListEnvelope<Tool>>({ method: 'get', url: '/tools' });
  return res.data ?? [];
}

/**
 * Two-call confirm-token protocol:
 *   1. First POST with no `confirm_token` — if the tool is destructive the
 *      server replies `202` with `{ confirm_token, expires_in }`. The client
 *      throws a `ConfirmTokenError` so the UI can prompt the operator.
 *   2. Second POST with the minted token — server replies `200` with the
 *      actual invocation result.
 *
 * Non-destructive tools skip step 1 and reply `200` immediately.
 */
export async function invokeTool(
  serverId: string,
  toolName: string,
  args: Record<string, unknown> = {},
  confirmToken?: string,
): Promise<ToolInvokeResult> {
  const url = `/servers/${encodeURIComponent(serverId)}/tools/${encodeURIComponent(toolName)}/invoke`;
  const body = confirmToken ? { ...args, confirm_token: confirmToken } : args;

  // We need the raw response to detect 202 vs 200 — the request() helper
  // strips the envelope.
  const response = await getApiClient().request<ToolInvokeResult & { confirm_token?: string; expires_in?: number }>({
    method: 'post',
    url,
    data: body,
  });

  if (response.status === 202) {
    const mintData = response.data as { confirm_token?: string; expires_in?: number } | undefined;
    throw new ConfirmTokenError(
      { error: { code: 'confirmation_required', message: 'Confirm-token required for destructive invocation.' } },
      { confirm_token: mintData?.confirm_token, expires_in: mintData?.expires_in },
    );
  }

  return response.data as ToolInvokeResult;
}

// --------------------------------------------------------------------- //
// Resources
// --------------------------------------------------------------------- //

export async function listResources(serverId: string): Promise<Resource[]> {
  const res = await request<ListEnvelope<Resource>>({
    method: 'get',
    url: `/servers/${encodeURIComponent(serverId)}/resources`,
  });
  return res.data ?? [];
}

export async function getResource(serverId: string, uri: string): Promise<ResourceContent> {
  const res = await request<ResourceContentEnvelope>({
    method: 'get',
    url: `/servers/${encodeURIComponent(serverId)}/resources/${encodeURIComponent(uri)}`,
  });
  return res.data;
}

// --------------------------------------------------------------------- //
// Prompts
// --------------------------------------------------------------------- //

export async function listPrompts(serverId: string): Promise<Prompt[]> {
  const res = await request<ListEnvelope<Prompt>>({
    method: 'get',
    url: `/servers/${encodeURIComponent(serverId)}/prompts`,
  });
  return res.data ?? [];
}

export async function getPrompt(serverId: string, name: string): Promise<Prompt> {
  const res = await request<{ data: Prompt }>({
    method: 'get',
    url: `/servers/${encodeURIComponent(serverId)}/prompts/${encodeURIComponent(name)}`,
  });
  return res.data;
}

// --------------------------------------------------------------------- //
// Audit
// --------------------------------------------------------------------- //

export async function listAudit(filters: AuditListFilters = {}): Promise<AuditRow[]> {
  const res = await request<ListEnvelope<AuditRow>>({
    method: 'get',
    url: '/audit',
    params: filters,
  });
  return res.data ?? [];
}

export async function getAudit(id: string): Promise<AuditDetail> {
  const res = await request<{ data: AuditDetail }>({
    method: 'get',
    url: `/audit/${encodeURIComponent(id)}`,
  });
  return res.data;
}

/**
 * Replay an audited tool call. Same two-call confirm-token protocol as
 * {@link invokeTool}.
 */
export async function replayAudit(id: string, confirmToken?: string): Promise<unknown> {
  const url = `/audit/${encodeURIComponent(id)}/replay`;
  const body = confirmToken ? { confirm_token: confirmToken } : undefined;

  const response = await getApiClient().request<{ confirm_token?: string; expires_in?: number }>({
    method: 'post',
    url,
    data: body,
  });

  if (response.status === 202) {
    const mint = response.data;
    throw new ConfirmTokenError(
      { error: { code: 'confirmation_required', message: 'Confirm-token required to replay this audit.' } },
      { confirm_token: mint?.confirm_token, expires_in: mint?.expires_in },
    );
  }

  return response.data;
}

// --------------------------------------------------------------------- //
// Resilience
// --------------------------------------------------------------------- //

export async function listBreakers(): Promise<BreakerState[]> {
  const res = await request<ListEnvelope<BreakerState>>({ method: 'get', url: '/circuit-breaker' });
  return res.data ?? [];
}

/**
 * Reset a circuit breaker. Two-call confirm-token protocol.
 */
export async function resetBreaker(key: string, confirmToken?: string): Promise<void> {
  const url = `/circuit-breaker/${encodeURIComponent(key)}/reset`;
  const body = confirmToken ? { confirm_token: confirmToken } : undefined;

  const response = await getApiClient().request<{ confirm_token?: string; expires_in?: number }>({
    method: 'post',
    url,
    data: body,
  });

  if (response.status === 202) {
    const mint = response.data;
    throw new ConfirmTokenError(
      { error: { code: 'confirmation_required', message: 'Confirm-token required to reset this breaker.' } },
      { confirm_token: mint?.confirm_token, expires_in: mint?.expires_in },
    );
  }
}

// --------------------------------------------------------------------- //
// Events (SSE)
// --------------------------------------------------------------------- //

/**
 * Subscribe to the audit-invocation event stream. Returns a cleanup function
 * that closes the underlying `EventSource`. Errors are surfaced via the
 * `onError` callback; the EventSource auto-reconnects per spec until closed.
 */
export function subscribeEvents(
  onMessage: (event: AuditEvent) => void,
  onError?: (err: Event) => void,
): () => void {
  if (typeof EventSource === 'undefined') {
    // jsdom + node — no-op subscription useful for tests.
    return () => undefined;
  }

  // SSE doesn't carry the XSRF cookie reliably through cross-origin EventSource;
  // we rely on the same-origin cookie session in production. The URL is the
  // configured base + `/events`.
  const url = `${stripTrailingSlash(resolveBase())}/events`;
  const es = new EventSource(url, { withCredentials: true });

  const handler = (ev: MessageEvent) => {
    try {
      const parsed = JSON.parse(ev.data) as AuditEvent;
      onMessage(parsed);
    } catch {
      /* swallow malformed frame — server frame mis-format is a server bug */
    }
  };

  es.addEventListener('invocation', handler as EventListener);
  es.addEventListener('message', handler as EventListener);
  if (onError) {
    es.addEventListener('error', onError);
  }

  return () => {
    es.removeEventListener('invocation', handler as EventListener);
    es.removeEventListener('message', handler as EventListener);
    if (onError) {
      es.removeEventListener('error', onError);
    }
    es.close();
  };
}

function resolveBase(): string {
  // Use the axios client's baseURL so VITE_API_BASE + window.__MCP_PACK_ADMIN__
  // overrides apply to SSE too.
  const base = (getApiClient().defaults.baseURL ?? '/api/admin/mcp-pack') as string;
  return base;
}

function stripTrailingSlash(s: string): string {
  return s.replace(/\/+$/, '');
}

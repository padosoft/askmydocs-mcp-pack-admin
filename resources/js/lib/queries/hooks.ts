// TanStack Query READ hooks — one per GET endpoint. Mutations live in
// `lib/mutations/hooks.ts`. Every hook delegates to a typed endpoint helper
// in `lib/api/endpoints.ts`; keys come from `lib/queries/keys.ts` so the
// invalidation surface in mutations stays grep-able.

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import * as api from '../api/endpoints';
import { keys } from './keys';
import type {
  AuditDetail,
  AuditListFilters,
  AuditRow,
  BreakerState,
  HostApiKey,
  HostTenant,
  HostUserEnvelope,
  McpServer,
  McpServerPage,
  Prompt,
  Resource,
  ResourceContent,
  ServerListFilters,
  Tool,
} from '../api/types';

// --------------------------------------------------------------------- //
// Identity
// --------------------------------------------------------------------- //

export function useMe(): UseQueryResult<HostUserEnvelope> {
  return useQuery({
    queryKey: keys.me.user(),
    queryFn: api.fetchMe,
  });
}

export function useTenants(): UseQueryResult<HostTenant[]> {
  return useQuery({
    queryKey: keys.tenants.all(),
    queryFn: api.listTenants,
  });
}

export function useApiKeys(): UseQueryResult<HostApiKey[]> {
  return useQuery({
    queryKey: keys.apiKeys.all(),
    queryFn: api.listApiKeys,
  });
}

// --------------------------------------------------------------------- //
// Servers
// --------------------------------------------------------------------- //

export function useServers(filters?: ServerListFilters): UseQueryResult<McpServerPage> {
  return useQuery({
    queryKey: keys.servers.list(filters),
    queryFn: () => api.listServers(filters ?? {}),
  });
}

export function useServer(id: string | undefined | null): UseQueryResult<McpServer> {
  return useQuery({
    queryKey: keys.servers.detail(id ?? ''),
    queryFn: () => api.getServer(id as string),
    enabled: Boolean(id),
  });
}

export function useServerTools(id: string | undefined | null): UseQueryResult<Tool[]> {
  return useQuery({
    queryKey: keys.servers.tools(id ?? ''),
    queryFn: () => api.listServerTools(id as string),
    enabled: Boolean(id),
  });
}

// --------------------------------------------------------------------- //
// Tools (flat aggregator)
// --------------------------------------------------------------------- //

export function useTools(): UseQueryResult<Tool[]> {
  return useQuery({
    queryKey: keys.tools.all(),
    queryFn: api.listTools,
  });
}

// --------------------------------------------------------------------- //
// Resources
// --------------------------------------------------------------------- //

export function useResources(serverId: string | undefined | null): UseQueryResult<Resource[]> {
  return useQuery({
    queryKey: keys.servers.resources(serverId ?? ''),
    queryFn: () => api.listResources(serverId as string),
    enabled: Boolean(serverId),
  });
}

export function useResource(
  serverId: string | undefined | null,
  uri: string | undefined | null,
): UseQueryResult<ResourceContent> {
  return useQuery({
    queryKey: keys.servers.resourceContent(serverId ?? '', uri ?? ''),
    queryFn: () => api.getResource(serverId as string, uri as string),
    enabled: Boolean(serverId && uri),
  });
}

// --------------------------------------------------------------------- //
// Prompts
// --------------------------------------------------------------------- //

export function usePrompts(serverId: string | undefined | null): UseQueryResult<Prompt[]> {
  return useQuery({
    queryKey: keys.servers.prompts(serverId ?? ''),
    queryFn: () => api.listPrompts(serverId as string),
    enabled: Boolean(serverId),
  });
}

export function usePrompt(
  serverId: string | undefined | null,
  name: string | undefined | null,
): UseQueryResult<Prompt> {
  return useQuery({
    queryKey: keys.servers.prompt(serverId ?? '', name ?? ''),
    queryFn: () => api.getPrompt(serverId as string, name as string),
    enabled: Boolean(serverId && name),
  });
}

// --------------------------------------------------------------------- //
// Audit
// --------------------------------------------------------------------- //

export function useAudit(filters?: AuditListFilters): UseQueryResult<AuditRow[]> {
  return useQuery({
    queryKey: keys.audit.list(filters),
    queryFn: () => api.listAudit(filters ?? {}),
  });
}

export function useAuditDetail(id: string | undefined | null): UseQueryResult<AuditDetail> {
  return useQuery({
    queryKey: keys.audit.detail(id ?? ''),
    queryFn: () => api.getAudit(id as string),
    enabled: Boolean(id),
  });
}

// --------------------------------------------------------------------- //
// Resilience
// --------------------------------------------------------------------- //

export function useBreakers(): UseQueryResult<BreakerState[]> {
  return useQuery({
    queryKey: keys.breakers.all(),
    queryFn: api.listBreakers,
  });
}

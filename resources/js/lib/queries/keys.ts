// Centralised query-key factory. Every hook + every mutation invalidation
// goes through this surface so we have ONE place to refactor when the
// cache topology shifts. The key shape is `['<domain>', ...args]` — flat
// tuples are the TanStack recommendation for partial invalidation
// (`invalidateQueries({ queryKey: keys.servers.all() })` matches every
// `['servers', ...]` entry).

import type { AuditListFilters, ServerListFilters } from '../api/types';

export const keys = {
  me: {
    root: ['me'] as const,
    user: () => ['me', 'user'] as const,
  },
  tenants: {
    all: () => ['tenants'] as const,
  },
  apiKeys: {
    all: () => ['api-keys'] as const,
  },
  servers: {
    all: () => ['servers'] as const,
    list: (filters: ServerListFilters | undefined) => ['servers', 'list', filters ?? {}] as const,
    detail: (id: string) => ['servers', 'detail', id] as const,
    tools: (id: string) => ['servers', id, 'tools'] as const,
    resources: (id: string) => ['servers', id, 'resources'] as const,
    resourceContent: (id: string, uri: string) => ['servers', id, 'resources', uri] as const,
    prompts: (id: string) => ['servers', id, 'prompts'] as const,
    prompt: (id: string, name: string) => ['servers', id, 'prompts', name] as const,
  },
  tools: {
    all: () => ['tools'] as const,
  },
  audit: {
    all: () => ['audit'] as const,
    list: (filters: AuditListFilters | undefined) => ['audit', 'list', filters ?? {}] as const,
    detail: (id: string) => ['audit', 'detail', id] as const,
  },
  breakers: {
    all: () => ['breakers'] as const,
  },
} as const;

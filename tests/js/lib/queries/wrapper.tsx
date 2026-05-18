// Shared `<QueryClientProvider>` factory for tests. Every test gets a fresh
// client so cache state never leaks between specs. `retry: false` +
// `gcTime: 0` keep failures fast and prevent stale cache from bleeding.

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function withQueryClient(client: QueryClient = createTestQueryClient()) {
  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

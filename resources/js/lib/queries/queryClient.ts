// Shared TanStack Query client. Defaults tuned for an admin SPA:
//   - `staleTime: 30s` — admin data isn't real-time-critical; tabbing back
//     into the window shouldn't blast the API.
//   - `refetchOnWindowFocus: false` — same reason.
//   - `retry: 1` for queries (network blips) but `retry: 0` for mutations
//     (destructive ops should never auto-replay).
//
// Tests build their own client via `queries/testWrapper.tsx` with retries
// disabled and `gcTime: 0` so cache state doesn't leak between specs.

import { QueryClient } from '@tanstack/react-query';
import { AuthExpiredError, FeatureDisabledError } from '../api/errors';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Don't retry auth / feature-disabled — they won't fix themselves.
          if (error instanceof AuthExpiredError) return false;
          if (error instanceof FeatureDisabledError) return false;
          return failureCount < 1;
        },
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

// Module-singleton query client used by `main.tsx`. Component tests build
// their own client via the test wrapper.
export const queryClient = createQueryClient();

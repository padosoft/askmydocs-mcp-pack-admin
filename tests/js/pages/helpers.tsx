// @ts-nocheck
// Shared helpers for page-level Vitest specs in W3. Every page test boots a
// fresh axios client + an MSW handler stack and renders the page inside the
// real `<QueryClientProvider>` + `<MemoryRouter>` chain so the live-data
// `useQuery` hooks fire against the mocked endpoints.
//
// `renderWithProviders` is intentionally minimal: it does NOT mount the App
// shell — the page-level specs are about the page surface, not the sidebar /
// topbar / palette / etc. Smoke tests already cover those.

import React from 'react';
import { render, RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../../../resources/js/lib/ui';
import { withQueryClient } from '../lib/queries/wrapper';

export const BASE = 'http://127.0.0.1/api/admin/mcp-pack';

export function renderWithProviders(ui: React.ReactNode, initialPath = '/'): RenderResult {
  const Wrapper = withQueryClient();
  return render(
    <Wrapper>
      <MemoryRouter initialEntries={[initialPath]}>
        <ToastProvider>{ui}</ToastProvider>
      </MemoryRouter>
    </Wrapper>,
  );
}

export const noop = () => undefined;

// @ts-nocheck
// W3 page-level coverage for ResourcesPage.

import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../lib/api/server';
import { createApiClient, setApiClient } from '../../../resources/js/lib/api/client';
import { ResourcesPage } from '../../../resources/js/pages/resources';
import { BASE, renderWithProviders, noop } from './helpers';

beforeEach(() => {
  setApiClient(createApiClient(BASE));
});

describe('ResourcesPage', () => {
  it('shows loading state while servers are pending', () => {
    server.use(
      http.get(`${BASE}/servers`, async () => {
        await new Promise(r => setTimeout(r, 50));
        return HttpResponse.json({ data: [] });
      }),
    );
    renderWithProviders(<ResourcesPage onNav={noop} />);
    expect(screen.getByTestId('resources-loading')).toBeInTheDocument();
  });

  it('shows the empty state when there are no enabled servers', async () => {
    server.use(
      http.get(`${BASE}/servers`, () => HttpResponse.json({ data: [] })),
    );
    renderWithProviders(<ResourcesPage onNav={noop} />);
    await waitFor(() => expect(screen.getByTestId('resources-empty')).toBeInTheDocument());
  });

  it('renders the ready state with a server tree when servers + resources land', async () => {
    server.use(
      http.get(`${BASE}/servers`, () => HttpResponse.json({
        data: [{ id: 'srv_a', name: 'live-a', transport: 'http', status: 'ok', enabled: true, url: 'https://x' }],
      })),
      http.get(`${BASE}/servers/srv_a/resources`, () => HttpResponse.json({
        data: [{ uri: 'mcp://x/readme.md', name: 'readme.md', type: 'file', mime: 'text/markdown', size: 100 }],
      })),
    );
    renderWithProviders(<ResourcesPage onNav={noop} />);
    await waitFor(() => expect(screen.getByTestId('resources-ready')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('resources-server-srv_a')).toBeInTheDocument());
  });

  it('shows the error state with retry when servers query fails', async () => {
    server.use(
      http.get(`${BASE}/servers`, () =>
        HttpResponse.json({ error: { code: 'server_error', message: 'bad' } }, { status: 500 }),
      ),
    );
    renderWithProviders(<ResourcesPage onNav={noop} />);
    await waitFor(() => expect(screen.getByTestId('resources-error')).toBeInTheDocument());
    expect(screen.getByTestId('resources-error-retry')).toBeInTheDocument();
  });

  it('shows tree-level error banner when per-server resources fail', async () => {
    server.use(
      http.get(`${BASE}/servers`, () => HttpResponse.json({
        data: [{ id: 'srv_a', name: 'live-a', transport: 'http', status: 'ok', enabled: true, url: 'https://x' }],
      })),
      http.get(`${BASE}/servers/srv_a/resources`, () =>
        HttpResponse.json({ error: { code: 'server_error', message: 'bad' } }, { status: 500 }),
      ),
    );
    renderWithProviders(<ResourcesPage onNav={noop} />);
    await waitFor(() => expect(screen.getByTestId('resources-tree-error')).toBeInTheDocument());
  });

  it('shows tree-level empty when per-server resources are empty', async () => {
    server.use(
      http.get(`${BASE}/servers`, () => HttpResponse.json({
        data: [{ id: 'srv_a', name: 'live-a', transport: 'http', status: 'ok', enabled: true, url: 'https://x' }],
      })),
      http.get(`${BASE}/servers/srv_a/resources`, () => HttpResponse.json({ data: [] })),
    );
    renderWithProviders(<ResourcesPage onNav={noop} />);
    await waitFor(() => expect(screen.getByTestId('resources-tree-empty')).toBeInTheDocument());
  });
});

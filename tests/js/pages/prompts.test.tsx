// @ts-nocheck
// W3 page-level coverage for PromptsPage.

import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../lib/api/server';
import { createApiClient, setApiClient } from '../../../resources/js/lib/api/client';
import { PromptsPage } from '../../../resources/js/pages/resources';
import { BASE, renderWithProviders, noop } from './helpers';

beforeEach(() => {
  setApiClient(createApiClient(BASE));
});

describe('PromptsPage', () => {
  it('shows loading state while servers are pending', () => {
    server.use(
      http.get(`${BASE}/servers`, async () => {
        await new Promise(r => setTimeout(r, 50));
        return HttpResponse.json({ data: [] });
      }),
    );
    renderWithProviders(<PromptsPage onNav={noop} />);
    expect(screen.getByTestId('prompts-loading')).toBeInTheDocument();
  });

  it('shows the empty state when there are no enabled servers', async () => {
    server.use(
      http.get(`${BASE}/servers`, () => HttpResponse.json({ data: [] })),
    );
    renderWithProviders(<PromptsPage onNav={noop} />);
    await waitFor(() => expect(screen.getByTestId('prompts-empty')).toBeInTheDocument());
  });

  it('shows the error state with retry when servers query fails', async () => {
    server.use(
      http.get(`${BASE}/servers`, () =>
        HttpResponse.json({ error: { code: 'server_error', message: 'bad' } }, { status: 500 }),
      ),
    );
    renderWithProviders(<PromptsPage onNav={noop} />);
    await waitFor(() => expect(screen.getByTestId('prompts-error')).toBeInTheDocument());
    expect(screen.getByTestId('prompts-error-retry')).toBeInTheDocument();
  });

  it('renders the ready state when servers + prompts land', async () => {
    server.use(
      http.get(`${BASE}/servers`, () => HttpResponse.json({
        data: [{ id: 'srv_a', name: 'live-a', transport: 'http', status: 'ok', enabled: true, url: 'https://x' }],
      })),
      http.get(`${BASE}/servers/srv_a/prompts`, () => HttpResponse.json({
        data: [{ name: 'research', desc: 'Research a topic', args: [], preview: [] }],
      })),
      http.get(`${BASE}/servers/srv_a/prompts/research`, () => HttpResponse.json({
        data: { name: 'research', desc: 'Research a topic', args: [], preview: [] },
      })),
    );
    renderWithProviders(<PromptsPage onNav={noop} />);
    await waitFor(() => expect(screen.getByTestId('prompts-ready')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('prompts-row-research')).toBeInTheDocument());
  });

  it('shows the per-server list error when prompts fetch fails', async () => {
    server.use(
      http.get(`${BASE}/servers`, () => HttpResponse.json({
        data: [{ id: 'srv_a', name: 'live-a', transport: 'http', status: 'ok', enabled: true, url: 'https://x' }],
      })),
      http.get(`${BASE}/servers/srv_a/prompts`, () =>
        HttpResponse.json({ error: { code: 'server_error', message: 'gone' } }, { status: 500 }),
      ),
    );
    renderWithProviders(<PromptsPage onNav={noop} />);
    await waitFor(() => expect(screen.getByTestId('prompts-list-error')).toBeInTheDocument());
  });

  it('shows the per-server list empty when prompts fetch returns empty', async () => {
    server.use(
      http.get(`${BASE}/servers`, () => HttpResponse.json({
        data: [{ id: 'srv_a', name: 'live-a', transport: 'http', status: 'ok', enabled: true, url: 'https://x' }],
      })),
      http.get(`${BASE}/servers/srv_a/prompts`, () => HttpResponse.json({ data: [] })),
    );
    renderWithProviders(<PromptsPage onNav={noop} />);
    await waitFor(() => expect(screen.getByTestId('prompts-list-empty')).toBeInTheDocument());
  });
});

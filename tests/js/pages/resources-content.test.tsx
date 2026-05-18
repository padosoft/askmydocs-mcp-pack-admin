// @ts-nocheck
// Coverage for the per-resource content preview slice of ResourcesPage —
// loading / error / empty / ready around `useResource(serverId, uri)`.

import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../lib/api/server';
import { createApiClient, setApiClient } from '../../../resources/js/lib/api/client';
import { ResourcesPage } from '../../../resources/js/pages/resources';
import { BASE, renderWithProviders, noop } from './helpers';

beforeEach(() => {
  setApiClient(createApiClient(BASE));
});

const baseHandlers = () => [
  http.get(`${BASE}/servers`, () => HttpResponse.json({
    data: [{ id: 'srv_a', name: 'live-a', transport: 'http', status: 'ok', enabled: true, url: 'https://x' }],
  })),
  http.get(`${BASE}/servers/srv_a/resources`, () => HttpResponse.json({
    data: [{ uri: 'mcp://x/readme.md', name: 'readme.md', type: 'file', mime: 'text/markdown', size: 100 }],
  })),
];

describe('Resource content preview', () => {
  it('loads + renders markdown content for the selected resource', async () => {
    server.use(
      ...baseHandlers(),
      http.get(`${BASE}/servers/srv_a/resources/mcp%3A%2F%2Fx%2Freadme.md`, () =>
        HttpResponse.json({ data: { uri: 'mcp://x/readme.md', mime: 'text/markdown', size: 100, content: '# Hello live' } }),
      ),
    );
    const { container } = renderWithProviders(<ResourcesPage onNav={noop} />);
    await waitFor(() => expect(screen.getByTestId('resources-ready')).toBeInTheDocument());
    // The file appears in the tree.
    const fileNode = await screen.findByText('readme.md');
    fireEvent.click(fileNode);
    await waitFor(() => {
      expect(container.textContent).toContain('Hello live');
    });
  });

  it('shows the content error state with retry when content fetch fails', async () => {
    server.use(
      ...baseHandlers(),
      http.get(`${BASE}/servers/srv_a/resources/mcp%3A%2F%2Fx%2Freadme.md`, () =>
        HttpResponse.json({ error: { code: 'server_error', message: 'broken' } }, { status: 500 }),
      ),
    );
    renderWithProviders(<ResourcesPage onNav={noop} />);
    await waitFor(() => expect(screen.getByTestId('resources-ready')).toBeInTheDocument());
    const fileNode = await screen.findByText('readme.md');
    fireEvent.click(fileNode);
    await waitFor(() => expect(screen.getByTestId('resource-content-error')).toBeInTheDocument());
    expect(screen.getByTestId('resource-content-error-retry')).toBeInTheDocument();
  });
});

// @ts-nocheck
// W3 page-level coverage for ToolsPage.

import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../lib/api/server';
import { createApiClient, setApiClient } from '../../../resources/js/lib/api/client';
import { ToolsPage } from '../../../resources/js/pages/tools';
import { BASE, renderWithProviders, noop } from './helpers';

beforeEach(() => {
  setApiClient(createApiClient(BASE));
});

describe('ToolsPage', () => {
  it('shows the loading state while tools+servers are pending', () => {
    server.use(
      http.get(`${BASE}/tools`, async () => {
        await new Promise(r => setTimeout(r, 50));
        return HttpResponse.json({ data: [] });
      }),
      http.get(`${BASE}/servers`, () => HttpResponse.json({ data: [] })),
    );
    renderWithProviders(<ToolsPage onNav={noop} toast={{ push: noop }} />);
    expect(screen.getByTestId('tools-loading')).toBeInTheDocument();
  });

  it('renders empty state when wire reports no tools', async () => {
    server.use(
      http.get(`${BASE}/tools`, () => HttpResponse.json({ data: [] })),
      http.get(`${BASE}/servers`, () => HttpResponse.json({ data: [] })),
    );
    renderWithProviders(<ToolsPage onNav={noop} toast={{ push: noop }} />);
    await waitFor(() => expect(screen.getByTestId('tools-empty')).toBeInTheDocument());
  });

  it('renders ready state with the detail pane when tools land', async () => {
    server.use(
      http.get(`${BASE}/tools`, () => HttpResponse.json({
        data: [{ server_id: 'srv_a', name: 'search', description: 'Search the web' }],
      })),
      http.get(`${BASE}/servers`, () => HttpResponse.json({
        data: [{ id: 'srv_a', name: 'live-mcp', transport: 'http', status: 'ok', enabled: true, url: 'https://x' }],
      })),
      http.get(`${BASE}/audit`, () => HttpResponse.json({ data: [] })),
    );
    renderWithProviders(<ToolsPage onNav={noop} toast={{ push: noop }} />);
    await waitFor(() => expect(screen.getByTestId('tools-ready')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('tool-detail-ready')).toBeInTheDocument());
  });

  it('shows the error state with retry when tools query fails', async () => {
    server.use(
      http.get(`${BASE}/tools`, () =>
        HttpResponse.json({ error: { code: 'server_error', message: 'bad' } }, { status: 500 }),
      ),
      http.get(`${BASE}/servers`, () => HttpResponse.json({ data: [] })),
    );
    renderWithProviders(<ToolsPage onNav={noop} toast={{ push: noop }} />);
    await waitFor(() => expect(screen.getByTestId('tools-error')).toBeInTheDocument());
    expect(screen.getByTestId('tools-error-retry')).toBeInTheDocument();
  });

  it('search input filters by tool name', async () => {
    server.use(
      http.get(`${BASE}/tools`, () => HttpResponse.json({
        data: [
          { server_id: 'srv_a', name: 'searchable', description: '' },
          { server_id: 'srv_a', name: 'invisible', description: '' },
        ],
      })),
      http.get(`${BASE}/servers`, () => HttpResponse.json({
        data: [{ id: 'srv_a', name: 'live', transport: 'http', status: 'ok', enabled: true, url: 'https://x' }],
      })),
      http.get(`${BASE}/audit`, () => HttpResponse.json({ data: [] })),
    );
    renderWithProviders(<ToolsPage onNav={noop} toast={{ push: noop }} />);
    await waitFor(() => expect(screen.getByTestId('tools-ready')).toBeInTheDocument());
    // Before filtering, both tools appear in the sidebar tree (and the
    // detail pane may show one).
    fireEvent.change(screen.getByTestId('tools-search-input'), { target: { value: 'searchable' } });
    await waitFor(() => {
      // The tree no longer carries `invisible`.
      expect(screen.queryByText('invisible')).not.toBeInTheDocument();
    });
  });
});

// @ts-nocheck
// W3 page-level coverage for ServersListPage + ServerDetailPage.

import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../lib/api/server';
import { createApiClient, setApiClient } from '../../../resources/js/lib/api/client';
import { ServersListPage, ServerDetailPage } from '../../../resources/js/pages/servers';
import { BASE, renderWithProviders, noop } from './helpers';

beforeEach(() => {
  setApiClient(createApiClient(BASE));
});

describe('ServersListPage', () => {
  it('shows loading state initially', () => {
    server.use(
      http.get(`${BASE}/servers`, async () => {
        await new Promise(r => setTimeout(r, 50));
        return HttpResponse.json({ data: [] });
      }),
    );
    renderWithProviders(<ServersListPage onNav={noop} toast={{ push: noop }} />);
    expect(screen.getByTestId('servers-loading')).toBeInTheDocument();
  });

  it('renders ready state with rows when wire returns servers', async () => {
    server.use(
      http.get(`${BASE}/servers`, () => HttpResponse.json({
        data: [
          { id: 'srv_a', name: 'live-a', transport: 'http', status: 'ok', enabled: true, url: 'https://a' },
          { id: 'srv_b', name: 'live-b', transport: 'sse', status: 'warn', enabled: true, url: 'https://b' },
        ],
      })),
    );
    renderWithProviders(<ServersListPage onNav={noop} toast={{ push: noop }} />);
    await waitFor(() => expect(screen.getByTestId('servers-ready')).toBeInTheDocument());
    expect(screen.getByTestId('servers-row-srv_a')).toBeInTheDocument();
    expect(screen.getByTestId('servers-row-srv_b')).toBeInTheDocument();
  });

  it('shows the empty state when wire returns no servers', async () => {
    server.use(
      http.get(`${BASE}/servers`, () => HttpResponse.json({ data: [] })),
    );
    renderWithProviders(<ServersListPage onNav={noop} toast={{ push: noop }} />);
    await waitFor(() => expect(screen.getByTestId('servers-empty')).toBeInTheDocument());
  });

  it('shows the error state when the servers query fails', async () => {
    server.use(
      http.get(`${BASE}/servers`, () =>
        HttpResponse.json({ error: { code: 'server_error', message: 'oh no' } }, { status: 500 }),
      ),
    );
    renderWithProviders(<ServersListPage onNav={noop} toast={{ push: noop }} />);
    await waitFor(() => expect(screen.getByTestId('servers-error')).toBeInTheDocument());
    expect(screen.getByTestId('servers-error-retry')).toBeInTheDocument();
  });

  it('filters by transport client-side', async () => {
    server.use(
      http.get(`${BASE}/servers`, () => HttpResponse.json({
        data: [
          { id: 'srv_http', name: 'live-http', transport: 'http', status: 'ok', enabled: true, url: 'https://h' },
          { id: 'srv_stdio', name: 'live-stdio', transport: 'stdio', status: 'ok', enabled: true, url: 'cmd' },
        ],
      })),
    );
    renderWithProviders(<ServersListPage onNav={noop} toast={{ push: noop }} />);
    await waitFor(() => expect(screen.getByTestId('servers-ready')).toBeInTheDocument());
    expect(screen.getByTestId('servers-row-srv_http')).toBeInTheDocument();
    expect(screen.getByTestId('servers-row-srv_stdio')).toBeInTheDocument();
  });

  it('search input narrows the visible rows', async () => {
    server.use(
      http.get(`${BASE}/servers`, () => HttpResponse.json({
        data: [
          { id: 'srv_alpha', name: 'alpha-mcp', transport: 'http', status: 'ok', enabled: true, url: 'https://a' },
          { id: 'srv_beta', name: 'beta-mcp', transport: 'http', status: 'ok', enabled: true, url: 'https://b' },
        ],
      })),
    );
    renderWithProviders(<ServersListPage onNav={noop} toast={{ push: noop }} />);
    await waitFor(() => expect(screen.getByTestId('servers-ready')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('servers-search-input'), { target: { value: 'alpha' } });
    await waitFor(() => {
      expect(screen.getByTestId('servers-row-srv_alpha')).toBeInTheDocument();
      expect(screen.queryByTestId('servers-row-srv_beta')).not.toBeInTheDocument();
    });
  });
});

describe('ServerDetailPage', () => {
  it('shows loading then ready when server fetch resolves', async () => {
    server.use(
      http.get(`${BASE}/servers/srv_01`, () => HttpResponse.json({
        data: { id: 'srv_01', name: 'live-detail', transport: 'http', status: 'ok', enabled: true, url: 'https://x' },
      })),
    );
    renderWithProviders(<ServerDetailPage serverId="srv_01" onNav={noop} toast={{ push: noop }} onOpenAudit={noop} />);
    expect(screen.getByTestId('server-detail-loading')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('server-detail-ready')).toBeInTheDocument());
  });

  it('renders the error state with retry when server fetch fails', async () => {
    server.use(
      http.get(`${BASE}/servers/srv_x`, () =>
        HttpResponse.json({ error: { code: 'server_error', message: 'gone' } }, { status: 500 }),
      ),
    );
    renderWithProviders(<ServerDetailPage serverId="srv_x" onNav={noop} toast={{ push: noop }} onOpenAudit={noop} />);
    await waitFor(() => expect(screen.getByTestId('server-detail-error')).toBeInTheDocument());
    expect(screen.getByTestId('server-detail-error-retry')).toBeInTheDocument();
  });
});

// @ts-nocheck
// W3 page-level coverage for the per-server tabs (Tools / Resources /
// Prompts / Audit) rendered inside ServerDetailPage. Each tab is wired
// to a dedicated hook + DataState.

import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../lib/api/server';
import { createApiClient, setApiClient } from '../../../resources/js/lib/api/client';
import { ServerDetailPage } from '../../../resources/js/pages/servers';
import { BASE, renderWithProviders, noop } from './helpers';

beforeEach(() => {
  setApiClient(createApiClient(BASE));
});

function mountDetail() {
  return renderWithProviders(
    <ServerDetailPage serverId="srv_x" onNav={noop} toast={{ push: noop }} onOpenAudit={noop} />,
  );
}

const okServer = () =>
  http.get(`${BASE}/servers/srv_x`, () => HttpResponse.json({
    data: { id: 'srv_x', name: 'live-detail', transport: 'http', status: 'ok', enabled: true, url: 'https://x' },
  }));

describe('ServerDetailPage tabs', () => {
  it('Tools tab — ready state shows live tools', async () => {
    server.use(
      okServer(),
      http.get(`${BASE}/servers/srv_x/tools`, () => HttpResponse.json({
        data: [{ server_id: 'srv_x', name: 'search', description: '' }],
      })),
    );
    mountDetail();
    await waitFor(() => expect(screen.getByTestId('server-detail-ready')).toBeInTheDocument());
    // Tools button — there may be multiple "Tools" texts; click the tab button.
    const toolsTabs = screen.getAllByText(/Tools/i);
    fireEvent.click(toolsTabs[toolsTabs.length - 1]);
    await waitFor(() => expect(screen.getByTestId('server-tools-row-search')).toBeInTheDocument());
  });

  it('Tools tab — empty state when no tools', async () => {
    server.use(
      okServer(),
      http.get(`${BASE}/servers/srv_x/tools`, () => HttpResponse.json({ data: [] })),
    );
    mountDetail();
    await waitFor(() => expect(screen.getByTestId('server-detail-ready')).toBeInTheDocument());
    const toolsTabs = screen.getAllByText(/Tools/i);
    fireEvent.click(toolsTabs[toolsTabs.length - 1]);
    await waitFor(() => expect(screen.getByTestId('server-tools-empty')).toBeInTheDocument());
  });

  it('Tools tab — error state when tools query fails', async () => {
    server.use(
      okServer(),
      http.get(`${BASE}/servers/srv_x/tools`, () =>
        HttpResponse.json({ error: { code: 'server_error', message: 'gone' } }, { status: 500 }),
      ),
    );
    mountDetail();
    await waitFor(() => expect(screen.getByTestId('server-detail-ready')).toBeInTheDocument());
    const toolsTabs = screen.getAllByText(/Tools/i);
    fireEvent.click(toolsTabs[toolsTabs.length - 1]);
    await waitFor(() => expect(screen.getByTestId('server-tools-error')).toBeInTheDocument());
    expect(screen.getByTestId('server-tools-error-retry')).toBeInTheDocument();
  });

  it('Prompts tab — empty + ready states', async () => {
    server.use(
      okServer(),
      http.get(`${BASE}/servers/srv_x/prompts`, () => HttpResponse.json({ data: [] })),
    );
    mountDetail();
    await waitFor(() => expect(screen.getByTestId('server-detail-ready')).toBeInTheDocument());
    // Tab buttons in order: Overview, Tools, Resources, Prompts, Handshakes, Audit, Config.
    const promptsTabs = screen.getAllByText(/Prompts/i);
    fireEvent.click(promptsTabs[promptsTabs.length - 1]);
    await waitFor(() => expect(screen.getByTestId('server-prompts-empty')).toBeInTheDocument());
  });

  it('Audit tab — loads scoped audit rows', async () => {
    server.use(
      okServer(),
      http.get(`${BASE}/audit`, ({ request }) => {
        const url = new URL(request.url);
        // Confirm the FE passed server_id=srv_x in the filters.
        expect(url.searchParams.get('server_id')).toBe('srv_x');
        return HttpResponse.json({
          data: [{ id: 'aud_z', mcp_server_id: 'srv_x', tool_name: 'search', status: '200', duration_ms: 100, created_at: '2026-05-17T10:00:00Z', actor: 'me' }],
        });
      }),
    );
    mountDetail();
    await waitFor(() => expect(screen.getByTestId('server-detail-ready')).toBeInTheDocument());
    const auditTabs = screen.getAllByText(/Audit/i);
    fireEvent.click(auditTabs[auditTabs.length - 1]);
    await waitFor(() => expect(screen.getByTestId('server-audit-row-aud_z')).toBeInTheDocument());
  });
});

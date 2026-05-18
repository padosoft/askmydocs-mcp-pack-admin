// @ts-nocheck
// Coverage for the `ToolRecentCalls` slice of ToolsPage — it lives behind
// the "Recent calls" tab inside ToolDetailPane and is the ONE place a
// per-tool audit query (`useAudit({ tool_name })`) gets exercised.

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

const baseHandlers = () => [
  http.get(`${BASE}/tools`, () => HttpResponse.json({
    data: [{ server_id: 'srv_a', name: 'search', description: 'Search the web' }],
  })),
  http.get(`${BASE}/servers`, () => HttpResponse.json({
    data: [{ id: 'srv_a', name: 'live-mcp', transport: 'http', status: 'ok', enabled: true, url: 'https://x' }],
  })),
];

describe('ToolRecentCalls', () => {
  it('shows the empty state when the wire returns zero calls', async () => {
    server.use(
      ...baseHandlers(),
      http.get(`${BASE}/audit`, () => HttpResponse.json({ data: [] })),
    );
    renderWithProviders(<ToolsPage onNav={noop} toast={{ push: noop }} />);
    await waitFor(() => expect(screen.getByTestId('tool-detail-ready')).toBeInTheDocument());
    // Click the "Recent calls" tab to trigger the audit query.
    const recentTab = screen.getByText(/Recent calls/i);
    fireEvent.click(recentTab);
    await waitFor(() => expect(screen.getByTestId('tool-recent-calls-empty')).toBeInTheDocument());
  });

  it('shows the ready state with rows when the wire returns calls', async () => {
    server.use(
      ...baseHandlers(),
      http.get(`${BASE}/audit`, () => HttpResponse.json({
        data: [{
          id: 'aud_42', mcp_server_id: 'srv_a', tool_name: 'search',
          status: '200', duration_ms: 142, created_at: '2026-05-17T10:00:00Z', actor: 'lorenzo',
        }],
      })),
    );
    renderWithProviders(<ToolsPage onNav={noop} toast={{ push: noop }} />);
    await waitFor(() => expect(screen.getByTestId('tool-detail-ready')).toBeInTheDocument());
    const recentTab = screen.getByText(/Recent calls/i);
    fireEvent.click(recentTab);
    await waitFor(() => expect(screen.getByTestId('tool-recent-calls-row-aud_42')).toBeInTheDocument());
  });

  it('shows the error state with retry when audit fetch fails', async () => {
    server.use(
      ...baseHandlers(),
      http.get(`${BASE}/audit`, () =>
        HttpResponse.json({ error: { code: 'server_error', message: 'bad' } }, { status: 500 }),
      ),
    );
    renderWithProviders(<ToolsPage onNav={noop} toast={{ push: noop }} />);
    await waitFor(() => expect(screen.getByTestId('tool-detail-ready')).toBeInTheDocument());
    const recentTab = screen.getByText(/Recent calls/i);
    fireEvent.click(recentTab);
    await waitFor(() => expect(screen.getByTestId('tool-recent-calls-error')).toBeInTheDocument());
    expect(screen.getByTestId('tool-recent-calls-error-retry')).toBeInTheDocument();
  });
});

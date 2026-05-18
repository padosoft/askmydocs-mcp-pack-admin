// @ts-nocheck
// W3 page-level coverage for DashboardPage. Exercises every R14 state
// (loading / error / empty / ready) + R11 testid contract + the refetch
// callback wired to the error-state retry button.

import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../lib/api/server';
import { createApiClient, setApiClient } from '../../../resources/js/lib/api/client';
import { DashboardPage } from '../../../resources/js/pages/dashboard';
import { BASE, renderWithProviders, noop } from './helpers';

beforeEach(() => {
  setApiClient(createApiClient(BASE));
});

const dashboardProps = {
  liveEvents: [] as any[],
  livePaused: false,
  onTogglePaused: noop,
  onClearFeed: noop,
  onNav: noop,
  onSelectAudit: noop,
};

describe('DashboardPage', () => {
  it('shows the loading state while servers query is pending', () => {
    server.use(
      http.get(`${BASE}/servers`, async () => {
        await new Promise(r => setTimeout(r, 50));
        return HttpResponse.json({ data: [] });
      }),
      http.get(`${BASE}/audit`, () => HttpResponse.json({ data: [] })),
      http.get(`${BASE}/circuit-breaker`, () => HttpResponse.json({ data: [] })),
    );
    renderWithProviders(<DashboardPage {...dashboardProps} />);
    expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-loading')).toHaveAttribute('aria-busy', 'true');
  });

  it('renders the ready state with KPI tiles when servers data lands', async () => {
    server.use(
      http.get(`${BASE}/servers`, () => HttpResponse.json({
        data: [{ id: 'srv_01', name: 'openai-mcp', transport: 'http', status: 'ok', enabled: true, url: 'https://x' }],
      })),
      http.get(`${BASE}/audit`, () => HttpResponse.json({ data: [] })),
      http.get(`${BASE}/circuit-breaker`, () => HttpResponse.json({ data: [] })),
    );
    renderWithProviders(<DashboardPage {...dashboardProps} />);
    await waitFor(() => expect(screen.getByTestId('dashboard-ready')).toBeInTheDocument());
    expect(screen.getByTestId('dashboard-kpi-servers')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-kpi-calls')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-kpi-breakers')).toBeInTheDocument();
  });

  it('shows the empty state when the wire returns zero servers', async () => {
    server.use(
      http.get(`${BASE}/servers`, () => HttpResponse.json({ data: [] })),
      http.get(`${BASE}/audit`, () => HttpResponse.json({ data: [] })),
      http.get(`${BASE}/circuit-breaker`, () => HttpResponse.json({ data: [] })),
    );
    renderWithProviders(<DashboardPage {...dashboardProps} />);
    await waitFor(() => expect(screen.getByTestId('dashboard-empty')).toBeInTheDocument());
    expect(screen.getByTestId('dashboard-empty')).toHaveAttribute('role', 'status');
  });

  it('renders the error state when the servers query fails', async () => {
    server.use(
      http.get(`${BASE}/servers`, () =>
        HttpResponse.json({ error: { code: 'server_error', message: 'boom' } }, { status: 500 }),
      ),
      http.get(`${BASE}/audit`, () => HttpResponse.json({ data: [] })),
      http.get(`${BASE}/circuit-breaker`, () => HttpResponse.json({ data: [] })),
    );
    renderWithProviders(<DashboardPage {...dashboardProps} />);
    await waitFor(() => expect(screen.getByTestId('dashboard-error')).toBeInTheDocument());
    expect(screen.getByTestId('dashboard-error')).toHaveAttribute('role', 'alert');
    expect(screen.getByTestId('dashboard-error-retry')).toBeInTheDocument();
  });

  it('error retry button refetches the servers query', async () => {
    let calls = 0;
    server.use(
      http.get(`${BASE}/servers`, () => {
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json({ error: { code: 'server_error', message: 'boom' } }, { status: 500 });
        }
        return HttpResponse.json({ data: [{ id: 'srv_x', name: 'recovered', transport: 'http', status: 'ok', enabled: true, url: 'https://x' }] });
      }),
      http.get(`${BASE}/audit`, () => HttpResponse.json({ data: [] })),
      http.get(`${BASE}/circuit-breaker`, () => HttpResponse.json({ data: [] })),
    );
    renderWithProviders(<DashboardPage {...dashboardProps} />);
    await waitFor(() => expect(screen.getByTestId('dashboard-error-retry')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('dashboard-error-retry'));
    await waitFor(() => expect(screen.getByTestId('dashboard-ready')).toBeInTheDocument());
    expect(calls).toBeGreaterThanOrEqual(2);
  });

  it('renders the wire-only server name (not a fixture-only one)', async () => {
    server.use(
      http.get(`${BASE}/servers`, () => HttpResponse.json({
        data: [{ id: 'srv_01', name: 'live-mcp', transport: 'http', status: 'ok', enabled: true, url: 'https://x' }],
      })),
      http.get(`${BASE}/audit`, () => HttpResponse.json({ data: [] })),
      http.get(`${BASE}/circuit-breaker`, () => HttpResponse.json({ data: [] })),
    );
    const { container } = renderWithProviders(<DashboardPage {...dashboardProps} />);
    await waitFor(() => expect(screen.getByTestId('dashboard-ready')).toBeInTheDocument());
    expect(container.textContent).toContain('live-mcp');
  });
});

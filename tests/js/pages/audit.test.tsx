// @ts-nocheck
// W3 page-level coverage for AuditPage + AuditDrilldown.

import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../lib/api/server';
import { createApiClient, setApiClient } from '../../../resources/js/lib/api/client';
import { AuditPage, AuditDrilldown } from '../../../resources/js/pages/audit';
import { BASE, renderWithProviders, noop } from './helpers';

beforeEach(() => {
  setApiClient(createApiClient(BASE));
});

describe('AuditPage', () => {
  it('shows loading state initially', () => {
    server.use(
      http.get(`${BASE}/audit`, async () => {
        await new Promise(r => setTimeout(r, 50));
        return HttpResponse.json({ data: [] });
      }),
      http.get(`${BASE}/servers`, () => HttpResponse.json({ data: [] })),
    );
    renderWithProviders(<AuditPage onNav={noop} onOpenAudit={noop} initialAuditId={null} />);
    expect(screen.getByTestId('audit-loading')).toBeInTheDocument();
  });

  it('renders ready state with rows when audit data lands', async () => {
    server.use(
      http.get(`${BASE}/audit`, () => HttpResponse.json({
        data: [
          { id: 'aud_xx', mcp_server_id: 'srv_a', mcp_server_name: 'live', tool_name: 'search', status: '200', duration_ms: 142, created_at: '2026-05-17T10:00:00Z', actor: 'lorenzo' },
        ],
      })),
      http.get(`${BASE}/servers`, () => HttpResponse.json({ data: [] })),
    );
    renderWithProviders(<AuditPage onNav={noop} onOpenAudit={noop} initialAuditId={null} />);
    await waitFor(() => expect(screen.getByTestId('audit-ready')).toBeInTheDocument());
    expect(screen.getByTestId('audit-row-aud_xx')).toBeInTheDocument();
  });

  it('renders empty state when audit returns no rows', async () => {
    server.use(
      http.get(`${BASE}/audit`, () => HttpResponse.json({ data: [] })),
      http.get(`${BASE}/servers`, () => HttpResponse.json({ data: [] })),
    );
    renderWithProviders(<AuditPage onNav={noop} onOpenAudit={noop} initialAuditId={null} />);
    await waitFor(() => expect(screen.getByTestId('audit-empty')).toBeInTheDocument());
  });

  it('shows the error state with retry when audit query fails', async () => {
    server.use(
      http.get(`${BASE}/audit`, () =>
        HttpResponse.json({ error: { code: 'server_error', message: 'bad' } }, { status: 500 }),
      ),
      http.get(`${BASE}/servers`, () => HttpResponse.json({ data: [] })),
    );
    renderWithProviders(<AuditPage onNav={noop} onOpenAudit={noop} initialAuditId={null} />);
    await waitFor(() => expect(screen.getByTestId('audit-error')).toBeInTheDocument());
    expect(screen.getByTestId('audit-error-retry')).toBeInTheDocument();
  });

  it('triggers a refetch when the error-retry button is clicked', async () => {
    let calls = 0;
    server.use(
      http.get(`${BASE}/audit`, () => {
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json({ error: { code: 'server_error', message: 'first try' } }, { status: 500 });
        }
        return HttpResponse.json({ data: [] });
      }),
      http.get(`${BASE}/servers`, () => HttpResponse.json({ data: [] })),
    );
    renderWithProviders(<AuditPage onNav={noop} onOpenAudit={noop} initialAuditId={null} />);
    await waitFor(() => expect(screen.getByTestId('audit-error-retry')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('audit-error-retry'));
    await waitFor(() => expect(screen.getByTestId('audit-ready')).toBeInTheDocument());
    expect(calls).toBeGreaterThanOrEqual(2);
  });
});

describe('AuditDrilldown', () => {
  it('shows the loading banner while detail is pending', () => {
    server.use(
      http.get(`${BASE}/audit/aud_test`, async () => {
        await new Promise(r => setTimeout(r, 50));
        return HttpResponse.json({ data: { id: 'aud_test', status: '200', duration_ms: 142 } });
      }),
    );
    renderWithProviders(<AuditDrilldown auditId="aud_test" onClose={noop} toast={{ push: noop }} />);
    expect(screen.getByTestId('audit-drilldown-loading')).toBeInTheDocument();
  });

  it('shows an error banner with retry when detail fetch fails', async () => {
    server.use(
      http.get(`${BASE}/audit/aud_fail`, () =>
        HttpResponse.json({ error: { code: 'server_error', message: 'gone' } }, { status: 500 }),
      ),
    );
    renderWithProviders(<AuditDrilldown auditId="aud_fail" onClose={noop} toast={{ push: noop }} />);
    await waitFor(() => expect(screen.getByTestId('audit-drilldown-error')).toBeInTheDocument());
    expect(screen.getByTestId('audit-drilldown-error-retry')).toBeInTheDocument();
  });
});

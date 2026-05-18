// @ts-nocheck
// W4: AuditDrilldown replay — R21 two-call confirm-token protocol.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../lib/api/server';
import { createApiClient, setApiClient } from '../../../resources/js/lib/api/client';
import { AuditDrilldown } from '../../../resources/js/pages/audit';
import { BASE, renderWithProviders, noop } from './helpers';

beforeEach(() => {
  setApiClient(createApiClient(BASE));
});

function seedDetail() {
  server.use(
    http.get(`${BASE}/audit/aud_42`, () => HttpResponse.json({
      data: {
        id: 'aud_42',
        mcp_server_name: 'srv',
        tool_name: 'merge_pr',
        status: '200',
        duration_ms: 142,
        created_at: '2026-05-15T14:30:00Z',
      },
    })),
  );
}

describe('AuditDrilldown — replay R21', () => {
  it('two-call protocol: 202 mint → operator confirms → second call with token', async () => {
    seedDetail();
    const calls: Array<any> = [];
    server.use(
      http.post(`${BASE}/audit/aud_42/replay`, async ({ request }) => {
        const body = await request.json().catch(() => undefined);
        calls.push(body);
        if (!body || !(body as any).confirm_token) {
          return HttpResponse.json({ confirm_token: 'tok_replay', expires_in: 45 }, { status: 202 });
        }
        return HttpResponse.json({ ok: true });
      }),
    );

    const push = vi.fn();
    renderWithProviders(<AuditDrilldown auditId="aud_42" onClose={noop} toast={{ push }} />);

    // Wait for the drawer header to be ready.
    await waitFor(() => expect(screen.getByTestId('audit-drilldown-replay')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('audit-drilldown-replay'));

    // First leg fires the no-token POST.
    await waitFor(() => expect(calls.length).toBe(1));
    expect(calls[0]).toBeUndefined();

    // 202 surfaces the TypeToConfirmModal. Type the phrase and confirm.
    const phraseInput = await screen.findByRole('textbox');
    fireEvent.change(phraseInput, { target: { value: 'replay-merge_pr' } });
    fireEvent.click(screen.getByRole('button', { name: /replay invocation/i }));

    await waitFor(() => expect(calls.length).toBe(2));
    expect(calls[1]).toEqual({ confirm_token: 'tok_replay' });
    await waitFor(() => expect(push).toHaveBeenCalledWith(expect.objectContaining({ kind: 'ok', title: 'Replay queued' })));
  });

  it('200 on first call shows the success toast without a confirm modal', async () => {
    seedDetail();
    server.use(
      http.post(`${BASE}/audit/aud_42/replay`, () => HttpResponse.json({ ok: true })),
    );

    const push = vi.fn();
    renderWithProviders(<AuditDrilldown auditId="aud_42" onClose={noop} toast={{ push }} />);
    await waitFor(() => expect(screen.getByTestId('audit-drilldown-replay')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('audit-drilldown-replay'));
    await waitFor(() => expect(push).toHaveBeenCalledWith(expect.objectContaining({ kind: 'ok', title: 'Replay queued' })));
  });

  it('500 surfaces a Replay failed toast', async () => {
    seedDetail();
    server.use(
      http.post(`${BASE}/audit/aud_42/replay`, () =>
        HttpResponse.json({ error: { code: 'server_error', message: 'kaboom' } }, { status: 500 }),
      ),
    );

    const push = vi.fn();
    renderWithProviders(<AuditDrilldown auditId="aud_42" onClose={noop} toast={{ push }} />);
    await waitFor(() => expect(screen.getByTestId('audit-drilldown-replay')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('audit-drilldown-replay'));
    await waitFor(() => expect(push).toHaveBeenCalledWith(expect.objectContaining({ kind: 'err', title: 'Replay failed' })));
  });
});

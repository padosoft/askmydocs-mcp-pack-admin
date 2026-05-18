// @ts-nocheck
// W4: BreakersPage reset — R21 two-call confirm-token protocol.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../lib/api/server';
import { createApiClient, setApiClient } from '../../../resources/js/lib/api/client';
import { BreakersPage } from '../../../resources/js/pages/audit';
import { BASE, renderWithProviders, noop } from './helpers';

beforeEach(() => {
  setApiClient(createApiClient(BASE));
});

function seedBreakers() {
  server.use(
    http.get(`${BASE}/circuit-breaker`, () => HttpResponse.json({
      data: [
        { key: 'cb_a', server_id: 'srv_a', tool_name: 'merge_pr', state: 'open', failures: 7 },
      ],
    })),
  );
}

describe('BreakersPage — reset R21', () => {
  it('200 first call resets immediately without TypeToConfirm', async () => {
    seedBreakers();
    let body: any = undefined;
    server.use(
      http.post(`${BASE}/circuit-breaker/cb_a/reset`, async ({ request }) => {
        try { body = await request.json(); } catch { body = undefined; }
        return HttpResponse.json({}, { status: 200 });
      }),
    );

    const push = vi.fn();
    renderWithProviders(<BreakersPage onNav={noop} toast={{ push }} />);
    await waitFor(() => expect(screen.getByTestId('breakers-ready')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('breakers-reset-cb_a'));
    await waitFor(() => expect(screen.getByTestId('breakers-reset-confirm')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('breakers-reset-confirm'));

    await waitFor(() => expect(push).toHaveBeenCalledWith(expect.objectContaining({ kind: 'ok', title: 'Breaker reset' })));
    expect(body).toBeUndefined();
  });

  it('R21 two-call: 202 mint → TypeToConfirm phrase → second call carries token', async () => {
    seedBreakers();
    const calls: any[] = [];
    server.use(
      http.post(`${BASE}/circuit-breaker/cb_a/reset`, async ({ request }) => {
        let b: any;
        try { b = await request.json(); } catch { b = undefined; }
        calls.push(b);
        if (!b || !b.confirm_token) {
          return HttpResponse.json({ confirm_token: 'tok_brk', expires_in: 30 }, { status: 202 });
        }
        return HttpResponse.json({}, { status: 200 });
      }),
    );

    const push = vi.fn();
    renderWithProviders(<BreakersPage onNav={noop} toast={{ push }} />);
    await waitFor(() => expect(screen.getByTestId('breakers-ready')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('breakers-reset-cb_a'));
    // First confirm modal click sends the no-token request.
    fireEvent.click(await screen.findByTestId('breakers-reset-confirm'));
    await waitFor(() => expect(calls.length).toBe(1));
    expect(calls[0]).toBeUndefined();

    // Type-to-confirm modal takes over for the second leg.
    const phraseInput = await screen.findByRole('textbox');
    fireEvent.change(phraseInput, { target: { value: 'reset-cb_a' } });
    fireEvent.click(screen.getByRole('button', { name: /reset breaker/i }));

    await waitFor(() => expect(calls.length).toBe(2));
    expect(calls[1]).toEqual({ confirm_token: 'tok_brk' });
    await waitFor(() => expect(push).toHaveBeenCalledWith(expect.objectContaining({ kind: 'ok', title: 'Breaker reset' })));
  });

  it('500 surfaces a Reset failed toast', async () => {
    seedBreakers();
    server.use(
      http.post(`${BASE}/circuit-breaker/cb_a/reset`, () =>
        HttpResponse.json({ error: { code: 'server_error', message: 'no' } }, { status: 500 }),
      ),
    );

    const push = vi.fn();
    renderWithProviders(<BreakersPage onNav={noop} toast={{ push }} />);
    await waitFor(() => expect(screen.getByTestId('breakers-ready')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('breakers-reset-cb_a'));
    fireEvent.click(await screen.findByTestId('breakers-reset-confirm'));
    await waitFor(() => expect(push).toHaveBeenCalledWith(expect.objectContaining({ kind: 'err', title: 'Reset failed' })));
  });
});

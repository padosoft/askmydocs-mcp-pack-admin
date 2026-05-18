// @ts-nocheck
// W4 page-level coverage: tool invoke R21 two-call confirm-token
// protocol in `ToolPlayground`. The play-button POSTs WITHOUT a token;
// if the BE returns 202 the playground opens a TypeToConfirmModal; the
// operator types the phrase; the second POST carries the minted token.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../lib/api/server';
import { createApiClient, setApiClient } from '../../../resources/js/lib/api/client';
import { ToolsPage } from '../../../resources/js/pages/tools';
import { BASE, renderWithProviders, noop } from './helpers';

beforeEach(() => {
  setApiClient(createApiClient(BASE));
});

function seedToolsList() {
  server.use(
    http.get(`${BASE}/tools`, () => HttpResponse.json({
      data: [
        { name: 'delete-all', server_id: 'srv_d', description: 'destructive op', input_schema: { type: 'object', properties: { force: { type: 'boolean', default: true } } } },
      ],
    })),
    http.get(`${BASE}/servers`, () => HttpResponse.json({
      data: [
        { id: 'srv_d', name: 'danger-mcp', transport: 'http', status: 'ok', enabled: true, url: 'https://d' },
      ],
    })),
  );
}

describe('ToolPlayground — R21 two-call confirm-token protocol', () => {
  it('first call without token, then second call with token from the 202 mint', async () => {
    seedToolsList();
    const calls: Array<{ body: any }> = [];
    server.use(
      http.post(`${BASE}/servers/srv_d/tools/delete-all/invoke`, async ({ request }) => {
        const body = await request.json();
        calls.push({ body });
        if (!(body as any).confirm_token) {
          return HttpResponse.json({ confirm_token: 'tok_xyz', expires_in: 60 }, { status: 202 });
        }
        return HttpResponse.json({ ok: true, audit_id: 'aud_done' });
      }),
    );

    const push = vi.fn();
    renderWithProviders(<ToolsPage onNav={noop} toast={{ push }} />);
    await waitFor(() => expect(screen.getByTestId('tools-ready')).toBeInTheDocument());

    // First leg: click Invoke. No token in the body.
    fireEvent.click(screen.getByTestId('tools-playground-invoke'));
    await waitFor(() => expect(calls.length).toBe(1));
    expect(calls[0].body.confirm_token).toBeUndefined();

    // The 202 first-leg surfaces the TypeToConfirmModal — the search
    // input remains in the DOM, so pick the LAST textbox (the modal).
    await waitFor(() => expect(screen.getAllByRole('textbox').length).toBeGreaterThan(1));
    const inputs = screen.getAllByRole('textbox');
    const phraseInput = inputs[inputs.length - 1];
    fireEvent.change(phraseInput, { target: { value: 'invoke-delete-all' } });
    // Two "Invoke tool" buttons exist: the playground footer (disabled
    // while pending) and the modal danger-action. Click the danger
    // button by matching its class.
    const buttons = screen.getAllByRole('button', { name: /invoke tool/i });
    const danger = buttons.find((b) => (b as HTMLElement).className.includes('danger'));
    fireEvent.click(danger || buttons[buttons.length - 1]);

    // Second leg: token is now in the body.
    await waitFor(() => expect(calls.length).toBe(2));
    expect(calls[1].body.confirm_token).toBe('tok_xyz');
    await waitFor(() => expect(push).toHaveBeenCalledWith(expect.objectContaining({ kind: 'ok', title: expect.stringContaining('delete-all') })));
  });

  it('200 on first call skips the confirm modal entirely', async () => {
    seedToolsList();
    server.use(
      http.post(`${BASE}/servers/srv_d/tools/delete-all/invoke`, () =>
        HttpResponse.json({ ok: true, audit_id: 'aud_fast' }),
      ),
    );

    const push = vi.fn();
    renderWithProviders(<ToolsPage onNav={noop} toast={{ push }} />);
    await waitFor(() => expect(screen.getByTestId('tools-ready')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('tools-playground-invoke'));
    // No confirm phrase input should ever appear; success toast title
    // contains the tool name + "succeeded".
    await waitFor(() => expect(push).toHaveBeenCalledWith(expect.objectContaining({ kind: 'ok', title: expect.stringContaining('succeeded') })));
    // And the modal phrase input did NOT appear (only the search input
    // remains, no second textbox).
    expect(screen.getAllByRole('textbox').length).toBe(1);
  });

  it('422 ValidationError surfaces field errors inline', async () => {
    seedToolsList();
    server.use(
      http.post(`${BASE}/servers/srv_d/tools/delete-all/invoke`, () =>
        HttpResponse.json({
          message: 'Validation failed.',
          errors: { force: ['Force flag is mandatory for this tool.'] },
        }, { status: 422 }),
      ),
    );

    const push = vi.fn();
    renderWithProviders(<ToolsPage onNav={noop} toast={{ push }} />);
    await waitFor(() => expect(screen.getByTestId('tools-ready')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('tools-playground-invoke'));
    await waitFor(() => expect(screen.getByTestId('tools-playground-field-errors')).toBeInTheDocument());
    expect(screen.getByTestId('tools-playground-error-force')).toBeInTheDocument();
    expect(push).toHaveBeenCalledWith(expect.objectContaining({ kind: 'err', title: 'Validation failed' }));
  });
});

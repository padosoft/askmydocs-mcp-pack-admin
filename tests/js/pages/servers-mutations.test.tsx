// @ts-nocheck
// W4 page-level coverage: server CRUD mutations on `ServersListPage`,
// `ServerDetailPage` and `ServerNewPage`. Exercises the happy path + 422
// (ValidationError surfaces field errors) + 401 (AuthExpired fires the
// global event).

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../lib/api/server';
import { createApiClient, setApiClient } from '../../../resources/js/lib/api/client';
import {
  ServersListPage, ServerDetailPage, ServerNewPage,
} from '../../../resources/js/pages/servers';
import { BASE, renderWithProviders, noop } from './helpers';

beforeEach(() => {
  setApiClient(createApiClient(BASE));
});

describe('ServersListPage — bulk mutations', () => {
  it('bulk delete calls DELETE for every selected row and clears selection', async () => {
    const deleted: string[] = [];
    server.use(
      http.get(`${BASE}/servers`, () => HttpResponse.json({
        data: [
          { id: 'srv_a', name: 'live-a', transport: 'http', status: 'ok', enabled: true, url: 'https://a' },
          { id: 'srv_b', name: 'live-b', transport: 'http', status: 'ok', enabled: true, url: 'https://b' },
        ],
      })),
      http.delete(`${BASE}/servers/:id`, ({ params }) => {
        deleted.push(params.id as string);
        return HttpResponse.json({}, { status: 200 });
      }),
    );

    const push = vi.fn();
    renderWithProviders(<ServersListPage onNav={noop} toast={{ push }} />);
    await waitFor(() => expect(screen.getByTestId('servers-ready')).toBeInTheDocument());

    // Select both rows by checking their checkboxes.
    const rowA = screen.getByTestId('servers-row-srv_a');
    const rowB = screen.getByTestId('servers-row-srv_b');
    fireEvent.click(rowA.querySelector('input[type=checkbox]')!);
    fireEvent.click(rowB.querySelector('input[type=checkbox]')!);

    // Open the bulk-delete confirm modal.
    fireEvent.click(screen.getByTestId('servers-bulk-delete'));

    // The TypeToConfirmModal renders its phrase input AFTER the
    // search box; getAllByRole returns them in DOM order so the modal
    // input is index 1.
    const inputs = screen.getAllByRole('textbox');
    const phraseInput = inputs[inputs.length - 1];
    fireEvent.change(phraseInput, { target: { value: 'delete-2-servers' } });
    fireEvent.click(screen.getByRole('button', { name: /delete servers/i }));

    await waitFor(() => expect(deleted.sort()).toEqual(['srv_a', 'srv_b']));
    await waitFor(() => expect(push).toHaveBeenCalledWith(expect.objectContaining({ kind: 'err', title: expect.stringMatching(/^Deleted 2 server/) })));
  });

  it('bulk enable PATCHes every selected row with enabled=true', async () => {
    const patched: Array<{ id: string; body: unknown }> = [];
    server.use(
      http.get(`${BASE}/servers`, () => HttpResponse.json({
        data: [
          { id: 'srv_a', name: 'live-a', transport: 'http', status: 'ok', enabled: false, url: 'https://a' },
        ],
      })),
      http.patch(`${BASE}/servers/:id`, async ({ request, params }) => {
        patched.push({ id: params.id as string, body: await request.json() });
        return HttpResponse.json({}, { status: 200 });
      }),
    );

    const push = vi.fn();
    renderWithProviders(<ServersListPage onNav={noop} toast={{ push }} />);
    await waitFor(() => expect(screen.getByTestId('servers-ready')).toBeInTheDocument());

    const rowA = screen.getByTestId('servers-row-srv_a');
    fireEvent.click(rowA.querySelector('input[type=checkbox]')!);
    fireEvent.click(screen.getByTestId('servers-bulk-enable'));

    await waitFor(() => expect(patched).toHaveLength(1));
    expect(patched[0]).toEqual({ id: 'srv_a', body: { enabled: true } });
    await waitFor(() => expect(push).toHaveBeenCalledWith(expect.objectContaining({ kind: 'ok', title: 'Servers enabled' })));
  });

  it('bulk delete surfaces a failure toast when the server returns 500', async () => {
    server.use(
      http.get(`${BASE}/servers`, () => HttpResponse.json({
        data: [
          { id: 'srv_a', name: 'live-a', transport: 'http', status: 'ok', enabled: true, url: 'https://a' },
        ],
      })),
      http.delete(`${BASE}/servers/:id`, () =>
        HttpResponse.json({ error: { code: 'server_error', message: 'boom' } }, { status: 500 }),
      ),
    );

    const push = vi.fn();
    renderWithProviders(<ServersListPage onNav={noop} toast={{ push }} />);
    await waitFor(() => expect(screen.getByTestId('servers-ready')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('servers-row-srv_a').querySelector('input[type=checkbox]')!);
    fireEvent.click(screen.getByTestId('servers-bulk-delete'));

    const inputs = screen.getAllByRole('textbox');
    const phraseInput = inputs[inputs.length - 1];
    fireEvent.change(phraseInput, { target: { value: 'delete-1-servers' } });
    fireEvent.click(screen.getByRole('button', { name: /delete servers/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith(expect.objectContaining({ kind: 'err', title: 'Delete partially failed' })));
  });
});

describe('ServerDetailPage — mutations', () => {
  it('delete from detail page calls DELETE and navigates back to servers', async () => {
    let deletedId: string | null = null;
    server.use(
      http.get(`${BASE}/servers/srv_x`, () => HttpResponse.json({
        data: { id: 'srv_x', name: 'live-x', transport: 'http', status: 'ok', enabled: true, url: 'https://x' },
      })),
      http.delete(`${BASE}/servers/:id`, ({ params }) => {
        deletedId = params.id as string;
        return HttpResponse.json({}, { status: 200 });
      }),
    );

    const onNav = vi.fn();
    renderWithProviders(<ServerDetailPage serverId="srv_x" onNav={onNav} toast={{ push: noop }} onOpenAudit={noop} />);
    await waitFor(() => expect(screen.getByTestId('server-detail-ready')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('server-detail-delete'));
    const phraseInput = screen.getByRole('textbox');
    fireEvent.change(phraseInput, { target: { value: 'delete-server-live-x' } });
    fireEvent.click(screen.getByRole('button', { name: /delete server/i }));

    await waitFor(() => expect(deletedId).toBe('srv_x'));
    await waitFor(() => expect(onNav).toHaveBeenCalledWith('servers'));
  });

  it('handshake button calls POST /servers/{id}/handshake', async () => {
    let handshakeFired = false;
    server.use(
      http.get(`${BASE}/servers/srv_h`, () => HttpResponse.json({
        data: { id: 'srv_h', name: 'live-h', transport: 'http', status: 'ok', enabled: true, url: 'https://h' },
      })),
      http.post(`${BASE}/servers/srv_h/handshake`, () => {
        handshakeFired = true;
        return HttpResponse.json({}, { status: 200 });
      }),
    );

    const push = vi.fn();
    renderWithProviders(<ServerDetailPage serverId="srv_h" onNav={noop} toast={{ push }} onOpenAudit={noop} />);
    await waitFor(() => expect(screen.getByTestId('server-detail-ready')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('server-detail-handshake'));
    await waitFor(() => expect(handshakeFired).toBe(true));
    await waitFor(() => expect(push).toHaveBeenCalledWith(expect.objectContaining({ kind: 'ok', title: 'Handshake complete' })));
  });
});

describe('ServerNewPage — create wizard', () => {
  it('happy path: submits wire-shaped payload then navigates to /servers', async () => {
    let received: unknown = null;
    server.use(
      http.post(`${BASE}/servers`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({
          data: { id: 'srv_new', name: 'newish', transport: 'http', url: 'https://new', enabled: true },
        }, { status: 201 });
      }),
    );

    const onNav = vi.fn();
    const push = vi.fn();
    renderWithProviders(<ServerNewPage onNav={onNav} toast={{ push }} />);

    // Step 1 — fill name + Next.
    const nameInput = screen.getByPlaceholderText('my-mcp-server');
    fireEvent.change(nameInput, { target: { value: 'newish' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Step 2 — fill URL + Next.
    const urlInput = await screen.findByPlaceholderText('https://example.com/mcp/v1');
    fireEvent.change(urlInput, { target: { value: 'https://new' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Step 3 — submit.
    fireEvent.click(await screen.findByTestId('servers-new-submit'));

    await waitFor(() => expect(received).toEqual({
      name: 'newish', transport: 'http', url: 'https://new', enabled: true,
    }));
    await waitFor(() => expect(onNav).toHaveBeenCalledWith('servers'));
  });

  it('422 ValidationError jumps back to the step owning the failing field', async () => {
    server.use(
      http.post(`${BASE}/servers`, () =>
        HttpResponse.json({
          message: 'Validation failed.',
          errors: { name: ['The name has already been taken.'] },
        }, { status: 422 }),
      ),
    );

    const push = vi.fn();
    renderWithProviders(<ServerNewPage onNav={noop} toast={{ push }} />);

    // Fill steps then submit.
    fireEvent.change(screen.getByPlaceholderText('my-mcp-server'), { target: { value: 'duplicate' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    const urlInput = await screen.findByPlaceholderText('https://example.com/mcp/v1');
    fireEvent.change(urlInput, { target: { value: 'https://dup' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(await screen.findByTestId('servers-new-submit'));

    // After 422 the wizard jumps to step 1 (where `name` is owned) and
    // shows the inline error.
    await waitFor(() => expect(screen.getByText(/has already been taken/i)).toBeInTheDocument());
    expect(push).toHaveBeenCalledWith(expect.objectContaining({ kind: 'err', title: 'Validation failed' }));
  });

  it('AuthExpired (401) fires the global auth:expired event', async () => {
    server.use(
      http.post(`${BASE}/servers`, () =>
        HttpResponse.json({ error: { code: 'unauthenticated', message: 'expired' } }, { status: 401 }),
      ),
    );

    const fired: any[] = [];
    const handler = (e: any) => fired.push(e);
    document.addEventListener('auth:expired', handler);
    try {
      renderWithProviders(<ServerNewPage onNav={noop} toast={{ push: noop }} />);
      fireEvent.change(screen.getByPlaceholderText('my-mcp-server'), { target: { value: 'authgone' } });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      const urlInput = await screen.findByPlaceholderText('https://example.com/mcp/v1');
      fireEvent.change(urlInput, { target: { value: 'https://x' } });
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      fireEvent.click(await screen.findByTestId('servers-new-submit'));

      await waitFor(() => expect(fired.length).toBeGreaterThan(0));
    } finally {
      document.removeEventListener('auth:expired', handler);
    }
  });
});

// @ts-nocheck
// W3 page-level coverage for BreakersPage.

import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../lib/api/server';
import { createApiClient, setApiClient } from '../../../resources/js/lib/api/client';
import { BreakersPage } from '../../../resources/js/pages/audit';
import { BASE, renderWithProviders, noop } from './helpers';

beforeEach(() => {
  setApiClient(createApiClient(BASE));
});

describe('BreakersPage', () => {
  it('shows loading state initially', () => {
    server.use(
      http.get(`${BASE}/circuit-breaker`, async () => {
        await new Promise(r => setTimeout(r, 50));
        return HttpResponse.json({ data: [] });
      }),
    );
    renderWithProviders(<BreakersPage onNav={noop} toast={{ push: noop }} />);
    expect(screen.getByTestId('breakers-loading')).toBeInTheDocument();
  });

  it('renders ready state with breaker cards when wire returns breakers', async () => {
    server.use(
      http.get(`${BASE}/circuit-breaker`, () => HttpResponse.json({
        data: [
          { key: 'cb_a', server_id: 'srv_a', tool_name: 'search', state: 'open', failures: 7 },
          { key: 'cb_b', server_id: 'srv_b', tool_name: 'merge_pr', state: 'closed', failures: 0 },
        ],
      })),
    );
    renderWithProviders(<BreakersPage onNav={noop} toast={{ push: noop }} />);
    await waitFor(() => expect(screen.getByTestId('breakers-ready')).toBeInTheDocument());
    expect(screen.getByTestId('breakers-card-cb_a')).toBeInTheDocument();
    expect(screen.getByTestId('breakers-card-cb_b')).toBeInTheDocument();
  });

  it('shows the empty state when wire returns no breakers', async () => {
    server.use(
      http.get(`${BASE}/circuit-breaker`, () => HttpResponse.json({ data: [] })),
    );
    renderWithProviders(<BreakersPage onNav={noop} toast={{ push: noop }} />);
    await waitFor(() => expect(screen.getByTestId('breakers-empty')).toBeInTheDocument());
  });

  it('shows the error state with retry when query fails', async () => {
    server.use(
      http.get(`${BASE}/circuit-breaker`, () =>
        HttpResponse.json({ error: { code: 'server_error', message: 'bad' } }, { status: 500 }),
      ),
    );
    renderWithProviders(<BreakersPage onNav={noop} toast={{ push: noop }} />);
    await waitFor(() => expect(screen.getByTestId('breakers-error')).toBeInTheDocument());
    expect(screen.getByTestId('breakers-error-retry')).toBeInTheDocument();
  });

  it('normalises wire `half_open` to the `half` UI bucket', async () => {
    server.use(
      http.get(`${BASE}/circuit-breaker`, () => HttpResponse.json({
        data: [{ key: 'cb_h', server_id: 'srv_a', tool_name: 'half', state: 'half_open', failures: 1 }],
      })),
    );
    renderWithProviders(<BreakersPage onNav={noop} toast={{ push: noop }} />);
    await waitFor(() => expect(screen.getByTestId('breakers-card-cb_h')).toBeInTheDocument());
    expect(screen.getByTestId('breakers-card-cb_h').className).toContain('half');
  });
});

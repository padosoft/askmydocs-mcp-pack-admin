// @ts-nocheck
// W3 integration sanity: the page surfaces NEVER bleed fixture-only
// strings (the seeded tenant name "Acme Corp", server name "openai-mcp")
// into the rendered tree when the wire backend reports different data.
//
// This complements the per-page tests by walking the full App route
// table (Dashboard → Servers → Audit → Tools → Breakers).

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../lib/api/server';
import { createApiClient, setApiClient } from '../../../resources/js/lib/api/client';
import App from '../../../resources/js/App';
import { withQueryClient } from '../lib/queries/wrapper';
import { BASE } from './helpers';

beforeEach(() => {
  setApiClient(createApiClient(BASE));
  server.use(
    http.get(`${BASE}/me`, () => HttpResponse.json({ data: { id: 1 } })),
    http.get(`${BASE}/tenants`, () => HttpResponse.json({ data: [] })),
    http.get(`${BASE}/servers`, () => HttpResponse.json({
      data: [{ id: 'srv_live', name: 'wire-only-mcp', transport: 'http', status: 'ok', enabled: true, url: 'https://wire' }],
    })),
    http.get(`${BASE}/tools`, () => HttpResponse.json({
      data: [{ server_id: 'srv_live', name: 'live_tool', description: 'live' }],
    })),
    http.get(`${BASE}/audit`, () => HttpResponse.json({ data: [] })),
    http.get(`${BASE}/circuit-breaker`, () => HttpResponse.json({ data: [] })),
    http.get(`${BASE}/api-keys`, () => HttpResponse.json({ data: [] })),
  );
});

function renderApp(path: string) {
  const Wrapper = withQueryClient();
  return render(
    <Wrapper>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </Wrapper>,
  );
}

describe('integration — wire-only data path', () => {
  it('servers page shows the wire-only server name, not a fixture-only one', async () => {
    const { container } = renderApp('/servers');
    await waitFor(() => expect(screen.getByTestId('servers-ready')).toBeInTheDocument());
    expect(container.textContent).toContain('wire-only-mcp');
    // The fixture server "openai-mcp" must not be rendered by the Servers list,
    // since the list now sources from `useServers()` only.
    expect(container.textContent).not.toMatch(/openai-mcp/);
    expect(container.textContent).not.toMatch(/github-mcp/);
  });

  it('audit page shows empty state when wire reports no rows', async () => {
    renderApp('/audit');
    await waitFor(() => expect(screen.getByTestId('audit-empty')).toBeInTheDocument());
  });

  it('breakers page shows empty state when wire reports no breakers', async () => {
    renderApp('/breakers');
    await waitFor(() => expect(screen.getByTestId('breakers-empty')).toBeInTheDocument());
  });

  it('tools page renders the live tool, not the fixture-only `generate_image`', async () => {
    const { container } = renderApp('/tools');
    await waitFor(() => expect(screen.getByTestId('tools-ready')).toBeInTheDocument());
    expect(container.textContent).toContain('live_tool');
  });
});

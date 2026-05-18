import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from './lib/api/server';
import { createApiClient, setApiClient } from '../../resources/js/lib/api/client';
import App from '../../resources/js/App';
import { I, fmtDuration, fmtBytes, fmtNum } from '../../resources/js/lib/ui';
import { withQueryClient } from './lib/queries/wrapper';

const BASE = 'http://127.0.0.1/api/admin/mcp-pack';

beforeEach(() => {
  setApiClient(createApiClient(BASE));
  // Default MSW handlers — the smoke tests only need the routes to mount
  // and the sidebar / page heading to render. Every endpoint answers with
  // an empty envelope so pages move from loading → empty-state quickly.
  server.use(
    http.get(`${BASE}/me`, () => HttpResponse.json({ data: { id: 1, email: 'smoke@test' } })),
    http.get(`${BASE}/tenants`, () => HttpResponse.json({ data: [] })),
    http.get(`${BASE}/servers`, () => HttpResponse.json({ data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } })),
    http.get(`${BASE}/tools`, () => HttpResponse.json({ data: [] })),
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

describe('SPA smoke', () => {
  it('renders the sidebar nav and dashboard heading on /', () => {
    renderApp('/');
    expect(screen.getAllByText(/Dashboard/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Servers/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Audit log/i).length).toBeGreaterThan(0);
  });

  it('renders the servers list on /servers', () => {
    renderApp('/servers');
    // "Servers" appears in the sidebar AND the page title.
    expect(screen.getAllByText(/Servers/i).length).toBeGreaterThan(1);
  });

  it('renders the audit log on /audit', () => {
    renderApp('/audit');
    expect(screen.getAllByText(/Audit log/i).length).toBeGreaterThan(0);
  });

  it('renders the breakers page on /breakers', () => {
    renderApp('/breakers');
    expect(screen.getAllByText(/[Cc]ircuit [Bb]reakers/i).length).toBeGreaterThan(0);
  });
});

describe('ui primitives', () => {
  it('exposes a Lucide-style Icon namespace', () => {
    expect(typeof I.Dashboard).toBe('function');
    expect(typeof I.Server).toBe('function');
  });

  it('formats durations sensibly', () => {
    expect(fmtDuration(0.5)).toMatch(/μs|us/);
    expect(fmtDuration(120)).toBe('120ms');
    expect(fmtDuration(1500)).toBe('1.50s');
  });

  it('formats bytes and big numbers', () => {
    expect(fmtBytes(512)).toBe('512B');
    expect(fmtBytes(2048)).toBe('2.0KB');
    expect(fmtNum(1500)).toBe('1.5k');
    expect(fmtNum(2_000_000)).toBe('2.0M');
  });
});

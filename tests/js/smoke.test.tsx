import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../resources/js/App';
import { I, fmtDuration, fmtBytes, fmtNum } from '../../resources/js/lib/ui';

describe('SPA smoke', () => {
  it('renders the sidebar nav and dashboard heading on /', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getAllByText(/Dashboard/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Servers/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Audit log/i).length).toBeGreaterThan(0);
  });

  it('renders the servers list on /servers', () => {
    render(
      <MemoryRouter initialEntries={['/servers']}>
        <App />
      </MemoryRouter>,
    );
    // "Servers" appears in the sidebar AND the page title.
    expect(screen.getAllByText(/Servers/i).length).toBeGreaterThan(1);
  });

  it('renders the audit log on /audit', () => {
    render(
      <MemoryRouter initialEntries={['/audit']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getAllByText(/Audit log/i).length).toBeGreaterThan(0);
  });

  it('renders the breakers page on /breakers', () => {
    render(
      <MemoryRouter initialEntries={['/breakers']}>
        <App />
      </MemoryRouter>,
    );
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

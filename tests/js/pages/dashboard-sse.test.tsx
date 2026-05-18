// @ts-nocheck
// W4: SSE live-feed consumer test. The App.tsx shell subscribes to
// `/events` via `subscribeEvents()` and dispatches frames into local
// state. We can't easily mount the whole App tree in jsdom (router +
// fixtures + sidebars), so we test the same pattern with a tiny shim
// that exercises `subscribeEvents` against a controllable EventSource
// polyfill.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { subscribeEvents } from '../../../resources/js/lib/api/endpoints';
import { createApiClient, setApiClient } from '../../../resources/js/lib/api/client';
import { BASE } from './helpers';

beforeEach(() => {
  setApiClient(createApiClient(BASE));
});

// Minimal controllable EventSource polyfill — same approach used in the
// endpoint-level subscribeEvents test, generalised here for the consumer.
class FakeEventSource {
  static instances: FakeEventSource[] = [];
  public url: string;
  public withCredentials: boolean;
  public listeners: Record<string, ((ev: any) => void)[]> = {};
  public closed = false;

  constructor(url: string, init?: any) {
    this.url = url;
    this.withCredentials = init?.withCredentials ?? false;
    FakeEventSource.instances.push(this);
  }

  addEventListener(name: string, cb: (ev: any) => void) {
    (this.listeners[name] ||= []).push(cb);
  }

  removeEventListener(name: string, cb: (ev: any) => void) {
    this.listeners[name] = (this.listeners[name] || []).filter((x) => x !== cb);
  }

  emit(name: string, data: any) {
    const evt = { data: JSON.stringify(data) } as any;
    (this.listeners[name] || []).forEach((cb) => cb(evt));
  }

  emitError() {
    (this.listeners['error'] || []).forEach((cb) => cb(new Event('error')));
  }

  close() { this.closed = true; }
}

// Tiny component mirroring App.tsx's SSE wiring pattern.
function LiveFeedShim({ paused }: { paused: boolean }) {
  const [events, setEvents] = React.useState<any[]>([]);
  const pausedRef = React.useRef(paused);
  React.useEffect(() => { pausedRef.current = paused; }, [paused]);

  React.useEffect(() => {
    const cleanup = subscribeEvents((ev: any) => {
      if (pausedRef.current) return;
      setEvents((prev) => {
        const id = ev.id;
        const without = prev.filter((p) => p.id !== id);
        return [{ ...ev }, ...without].slice(0, 200);
      });
    });
    return cleanup;
  }, []);

  return (
    <ul data-testid="feed">
      {events.map((e) => (
        <li key={e.id} data-testid={`evt-${e.id}`}>{e.tool}</li>
      ))}
    </ul>
  );
}

describe('SSE live-feed consumer', () => {
  let originalEventSource: any;
  beforeEach(() => {
    originalEventSource = (globalThis as any).EventSource;
    FakeEventSource.instances = [];
    (globalThis as any).EventSource = FakeEventSource;
  });

  afterEach(() => {
    if (originalEventSource !== undefined) {
      (globalThis as any).EventSource = originalEventSource;
    } else {
      delete (globalThis as any).EventSource;
    }
  });

  it('opens an EventSource on mount and dispatches incoming events into state', async () => {
    render(<LiveFeedShim paused={false} />);
    await waitFor(() => expect(FakeEventSource.instances.length).toBe(1));

    const es = FakeEventSource.instances[0];
    act(() => {
      es.emit('invocation', { id: 'evt_1', tool: 'search', status: 200 });
    });

    await waitFor(() => expect(screen.getByTestId('evt-evt_1')).toBeInTheDocument());
  });

  it('tears down EventSource on unmount', async () => {
    const { unmount } = render(<LiveFeedShim paused={false} />);
    await waitFor(() => expect(FakeEventSource.instances.length).toBe(1));

    const es = FakeEventSource.instances[0];
    unmount();
    expect(es.closed).toBe(true);
  });

  it('dedupes by event id when the same id arrives twice', async () => {
    render(<LiveFeedShim paused={false} />);
    await waitFor(() => expect(FakeEventSource.instances.length).toBe(1));

    const es = FakeEventSource.instances[0];
    act(() => {
      es.emit('invocation', { id: 'evt_dup', tool: 'search', status: 200 });
      es.emit('invocation', { id: 'evt_dup', tool: 'search', status: 200 });
    });

    await waitFor(() => {
      expect(screen.getAllByTestId('evt-evt_dup')).toHaveLength(1);
    });
  });

  it('paused state drops incoming events without dispatching', async () => {
    render(<LiveFeedShim paused={true} />);
    await waitFor(() => expect(FakeEventSource.instances.length).toBe(1));

    const es = FakeEventSource.instances[0];
    act(() => {
      es.emit('invocation', { id: 'evt_drop', tool: 'search', status: 200 });
    });

    // No event row should appear.
    expect(screen.queryByTestId('evt-evt_drop')).not.toBeInTheDocument();
    // EventSource stays open even while paused (no reconnect cost).
    expect(es.closed).toBe(false);
  });
});

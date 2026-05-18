import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';

// jsdom's localStorage is on window, but React reads the bare `localStorage`
// global; explicitly bind both so getItem/setItem work as expected.
if (typeof globalThis.localStorage === 'undefined' || typeof (globalThis.localStorage as any).getItem !== 'function') {
  const store = new Map<string, string>();
  const ls = {
    getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
    setItem: (k: string, v: string) => { store.set(k, String(v)); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size; },
  };
  Object.defineProperty(globalThis, 'localStorage', { value: ls, writable: true, configurable: true });
}

// Vitest global setup. Stub out the global config the SPA expects from Blade.
(window as any).__MCP_PACK_ADMIN__ = {
  api_base: 'http://127.0.0.1/api/admin/mcp-pack',
  mount_prefix: '/admin/mcp-pack',
  theme_default: 'dark',
  asset_path: '/vendor/mcp-pack-admin',
};

// MSW lifecycle — `server` is lazily imported so any test file that doesn't
// touch the API client doesn't pay the polyfill cost. msw/node installs an
// `undici`-backed `fetch` + intercepts the global axios HTTP adapter.
beforeAll(async () => {
  const { server } = await import('./lib/api/server');
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(async () => {
  const { server } = await import('./lib/api/server');
  server.resetHandlers();
});

afterAll(async () => {
  const { server } = await import('./lib/api/server');
  server.close();
});

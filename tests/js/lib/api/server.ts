// Shared MSW server for endpoint-level tests. Each test file imports `server`
// and calls `server.use(...)` to register per-test handlers; the global
// `beforeAll/afterEach/afterAll` lifecycle is wired in `tests/js/setup.ts`.

import { setupServer } from 'msw/node';

export const server = setupServer();

# Changelog

All notable changes to `padosoft/askmydocs-mcp-pack-admin` are documented here.
The project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] → v1.1.0

### Added — Read-paths wired (W3)

The 8 read-path page surfaces in `resources/js/pages/` now consume the W2
TanStack Query hooks instead of importing the prototype fixture directly.
Every page surface implements the R14 (surface-failures-loudly) +
R11 (testid contract) + R15 (a11y) invariants — loading / error / empty
states are visible, retry buttons call `refetch()`, error states use
`role="alert"`, loading states use `aria-busy="true"`, empty states use
`role="status"`.

- **`resources/js/lib/data-state.tsx`** — new shared wrapper component
  `<DataState>` that translates a `UseQueryResult` into the four
  R14-mandated visible states with the R11 testid contract
  (`<base>-loading|error|empty|error-retry`) and R15 a11y attributes
  baked in. Re-used across every page tab + sub-section.
- **`pages/dashboard.tsx` → `DashboardPage`** — wired via `useServers()`
  + `useAudit({ per_page: 24 })` + `useBreakers()`. KPI tiles, recent
  failures, and the per-server health strip are now real-data. Live-feed
  is still simulator-driven (W4 picks up SSE wire). Sparklines, p50,
  calls_1h fall back to the fixture-keyed values when the wire schema
  doesn't carry them yet — flagged inline.
- **`pages/servers.tsx` → `ServersListPage`** — wired via
  `useServers({ q, status, transport, page, per_page })`. Filters route
  to the wire endpoint AND apply client-side as a belt-and-braces guard
  while BE filter coverage stabilises.
- **`pages/servers.tsx` → `ServerDetailPage`** — wired via `useServer(id)`
  for the page-level header + KPIs. Each detail tab is hook-backed:
  - Tools: `useServerTools(id)` → `<DataState testIdBase="server-tools">`.
  - Resources: `useResources(id)` → `<DataState testIdBase="server-resources">`.
  - Prompts: `usePrompts(id)` → `<DataState testIdBase="server-prompts">`.
  - Audit: `useAudit({ server_id: id, per_page: 30 })` →
    `<DataState testIdBase="server-audit">`.
  - Overview / Handshakes / Config remain fixture-augmented because the
    wire schema doesn't yet carry telemetry (sparklines, percentiles).
- **`pages/tools.tsx` → `ToolsPage`** — wired via `useTools()` for the
  global matrix + `useServers()` for the grouping sidebar. Per-tool
  recent calls (`ToolRecentCalls`) wired via `useAudit({ tool_name })`.
  The Try-it Playground (`ToolPlayground`) stays fixture-only — `invoke`
  is a write path, scheduled for W4.
- **`pages/audit.tsx` → `AuditPage`** — wired via
  `useAudit({...filters})`. Server-filter dropdown derives its options
  from `useServers()` (R18 — derive from DB not literal). Drill-down
  drawer (`AuditDrilldown`) wired via `useAuditDetail(auditId)`; falls
  back to the seeded fixture for fields the BE doesn't yet emit
  (timeline / headers / meta) with an explicit inline banner.
- **`pages/audit.tsx` → `BreakersPage`** — wired via `useBreakers()`.
  Wire `half_open` state is normalised to the `half` UI bucket.
  Live-countdown ticker preserved; reset-mutation remains W4 scope.
- **`pages/resources.tsx` → `ResourcesPage`** — wired via `useServers()`
  + `useResources(serverId)` + `useResource(serverId, uri)`. Each pane
  has its own loading / error / empty state — tree-level and content-level
  states are independent so the user can recover from a content-fetch
  failure without re-fetching the tree.
- **`pages/resources.tsx` → `PromptsPage`** — wired via `useServers()`
  + `usePrompts(serverId)` + `usePrompt(serverId, name)`. The previous
  cross-server flat list is now scoped to a single server with a
  dropdown selector.

**Excluded from this wave (stay on fixtures by design):**

- `PlaygroundPage` — OpenAPI explorer, no live-data dependency.
- `SettingsPage` — preferences / theme / density form. Tenants + API-keys
  sub-sections will wire in W4 alongside the mutation hooks they
  depend on (`useCreateApiKey`, `useRevokeApiKey`).
- `HelpPage` — static keyboard-shortcut / glossary / checklist content.

`resources/js/lib/data.ts` is RETAINED in the bundle because the three
excluded surfaces still import from it; a follow-up cleanup PR in v1.1
will trim it after `SettingsPage` finishes wiring in W4.

**Test coverage added (~65 new specs across 10 files):**

- `tests/js/lib/data-state.test.tsx` — `<DataState>` wrapper unit tests
  (loading/error/empty/ready + retry + role/aria attrs + custom empty).
- `tests/js/pages/dashboard.test.tsx`,
  `tests/js/pages/servers.test.tsx`,
  `tests/js/pages/tools.test.tsx`,
  `tests/js/pages/audit.test.tsx`,
  `tests/js/pages/breakers.test.tsx`,
  `tests/js/pages/resources.test.tsx`,
  `tests/js/pages/prompts.test.tsx`,
  `tests/js/pages/server-detail-tabs.test.tsx`,
  `tests/js/pages/tools-recent-calls.test.tsx`,
  `tests/js/pages/resources-content.test.tsx`,
  `tests/js/pages/integration.test.tsx` — per-page R14 / R11 coverage
  using MSW handlers + the shared `<QueryClientProvider>` wrapper from
  `tests/js/lib/queries/wrapper.tsx`.
- Existing `tests/js/smoke.test.tsx` updated to provide MSW handlers +
  QueryClient wrapper so it still passes after the data-layer swap.

Total Vitest count: 66 → 131 tests, 5 → 17 files. `npm test` +
`npm run typecheck` + `npm run build` all green.

**Notes:**

- Playwright E2E specs continue to run on fixture data; updating them to
  drive against the live data-layer is W5 scope. Local Playwright
  failures during W3 development are EXPECTED and addressed in W5.
- No mutations (write paths) are wired yet — W4 implements server
  create/update/delete, tool invoke (with confirm-token protocol),
  breaker reset, audit replay, API-key mint/revoke.
- The SPA NEVER sets `X-Tenant-Id` — host middleware owns tenant
  resolution (R30). Every hook delegates to `endpoints.ts` which uses
  the shared `request()` helper from `lib/api/client.ts`.

### Added — TanStack Query foundation (W2)

The data layer that backs every read + mutation in v1.1. The SPA stays
fully functional on fixture data after this PR merges; subsequent W3
sub-PRs swap pages over to the live hooks one route at a time so the
fixture-vs-real-data delta is reviewable in isolation.

- **`resources/js/lib/api/types.ts`** — hand-written TypeScript types
  mirroring all 19 schemas in `padosoft/askmydocs-mcp-pack` OpenAPI 3.1
  spec v1.5 (HostUser / HostTenant / HostApiKey / McpServer / Tool /
  AuditRow / AuditDetail / BreakerState / Resource / Prompt / AuditEvent
  / ConfirmTokenMint / ApiErrorPayload / ValidationErrorPayload + filters
  and envelopes). 1:1 with the wire shape — when the spec moves, this
  file moves with it.
- **`resources/js/lib/api/errors.ts`** — typed error hierarchy thrown by
  the axios client (`ApiError` base + `NetworkError` /
  `AuthExpiredError` / `FeatureDisabledError` / `ConfirmTokenError` /
  `ValidationError` subclasses). TanStack Query's `onError` distinguishes
  by `instanceof`, never by string matching (R14 — surface failures
  loudly).
- **`resources/js/lib/api/client.ts`** — singleton axios instance with:
  - `baseURL` resolved from `import.meta.env.VITE_API_BASE` →
    `window.__MCP_PACK_ADMIN__.api_base` → hard-coded
    `/api/admin/mcp-pack`.
  - `withCredentials: true` for Sanctum cookie auth.
  - Request interceptor: read `XSRF-TOKEN` cookie + echo as
    `X-XSRF-TOKEN` header on every non-GET request (URL-decoded;
    Laravel convention).
  - Response interceptor: 401 → `AuthExpiredError` + fires global
    `auth:expired` CustomEvent; 403 `feature_disabled` →
    `FeatureDisabledError`; 422 confirmation codes → `ConfirmTokenError`;
    422 with Laravel validation shape → `ValidationError`; network
    failures → `NetworkError`.
  - `apiBase()` / `getApiClient()` / `setApiClient()` / `request<T>()`
    typed helpers.
- **`resources/js/lib/api/endpoints.ts`** — one typed async function per
  OpenAPI endpoint (22 functions). Every dynamic path segment goes
  through `encodeURIComponent` (R19). `invokeTool` / `replayAudit` /
  `resetBreaker` implement the two-call confirm-token protocol (R21) —
  202 responses throw `ConfirmTokenError` carrying the minted token; the
  UI prompts the operator and calls again with the token bound in the
  body. `subscribeEvents()` wraps `EventSource` with envelope-aware JSON
  parsing.
- **`resources/js/lib/queries/queryClient.ts`** — shared `QueryClient`
  factory with admin-tuned defaults (`staleTime: 30s`,
  `refetchOnWindowFocus: false`, `retry: 1` for queries, `retry: 0` for
  mutations; auth-expired + feature-disabled errors short-circuit retry).
- **`resources/js/lib/queries/keys.ts`** — centralised query-key
  factory. Every read hook + every mutation invalidation routes through
  this surface.
- **`resources/js/lib/queries/hooks.ts`** — 13 read hooks: `useMe`,
  `useTenants`, `useApiKeys`, `useServers`, `useServer`, `useServerTools`,
  `useTools`, `useResources`, `useResource`, `usePrompts`, `usePrompt`,
  `useAudit`, `useAuditDetail`, `useBreakers`. ID-keyed hooks gate on
  `enabled: Boolean(id)` to avoid spurious requests on initial render.
- **`resources/js/lib/mutations/hooks.ts`** — 10 mutation hooks:
  `useUpdatePreferences`, `useCreateApiKey`, `useRevokeApiKey`
  (optimistic), `useCreateServer`, `useUpdateServer`, `useDeleteServer`,
  `useHandshake`, `useInvokeTool`, `useReplayAudit`, `useResetBreaker`.
  Confirm-token-aware mutations re-throw `ConfirmTokenError` for the UI
  layer to handle; on success they invalidate the matching read keys.
- **`resources/js/env.d.ts`** — typed `import.meta.env.VITE_API_BASE`
  declaration so `vite build --mode production` enforces the contract.
- **`resources/js/main.tsx`** — wrapped `<App />` in
  `<QueryClientProvider>`; `<ReactQueryDevtools />` mounted only when
  `import.meta.env.DEV`.
- **`resources/js/App.tsx`** — added `auth:expired` event listener +
  dedicated toast with `data-testid="auth-expired-toast"` for E2E
  assertions (R11). NO read-path swap yet — every page still renders
  from `lib/data.ts` fixtures; W3 swaps page-by-page.
- **`vite.config.ts`** — added `axios`, `@tanstack/react-query` and
  `@tanstack/react-query-devtools` to `optimizeDeps.include` so the dev
  server boots without on-demand cold starts.

### Tests

- `tests/js/lib/api/client.test.ts` — 11 specs covering XSRF echo +
  every error-mapping branch (401 → AuthExpiredError + CustomEvent /
  403 feature_disabled / 422 confirmation codes / 422 validation shape /
  network error / generic 5xx) backed by MSW v2.
- `tests/js/lib/api/endpoints.test.ts` — 24 specs covering one
  happy-path per endpoint + the two-call confirm-token protocol
  (`invokeTool` / `replayAudit` / `resetBreaker`).
- `tests/js/lib/queries/hooks.test.tsx` — 9 specs exercising
  `loading → success → cached` transitions through `renderHook` +
  `QueryClientProvider`.
- `tests/js/lib/mutations/hooks.test.tsx` — 9 specs covering create /
  update / handshake + the destructive flow (`useInvokeTool` /
  `useReplayAudit` / `useResetBreaker`) with explicit confirm-token
  round-trips.
- `tests/js/setup.ts` — wires MSW `setupServer` lifecycle
  (`listen` / `resetHandlers` / `close`) into Vitest globals.

Vitest test count: **7 → 64** (+57).

### Dependencies

- Added `@tanstack/react-query` ^5 and `axios` ^1 (runtime).
- Added `@tanstack/react-query-devtools` ^5 and `msw` ^2 (dev).

### Bundle size

- Production build:
  `main-*.js` 346 KB / 99 KB gzipped (was ~290 KB / ~85 KB before;
  delta ~+56 KB raw / ~+14 KB gzipped — matches the projected TanStack
  Query + axios overhead).
- `main-*.css` unchanged at 46 KB / 8.7 KB gzipped.

### Notes

- W3 wires read-paths page-by-page; the SPA continues to render fixture
  data after this PR merges. Reviewers can confirm by running
  `npm run dev` and inspecting any route — every existing page still
  works against the in-memory dataset.
- Standalone-agnostic invariant preserved: zero references to the
  AskMyDocs host code from this package.

## [v1.0.1] — 2026-05-17

### Changed
- Frontend toolchain major bump: `vite` 5 → 8.0.13, `vitest` 2 → 4.1.6,
  `@vitejs/plugin-react` 4 → 6.0.2. All peer-dep ranges aligned (plugin-react
  v6 declares `vite ^8.0.0`). Vitest now runs on the new rolldown-backed Vite 8.
- `engines.node` tightened from `>=20.0.0` to `^20.19.0 || >=22.12.0` to match
  the stricter constraint vite 8 propagates — installing on Node 20.0–20.18
  was silently broken before.
- `actions/setup-node` in the CI workflow pinned to `node-version: '20.19'`
  (string) on both Vitest and Playwright jobs so the runner Node patch
  always satisfies the upgraded toolchain.
- Direct `esbuild` dev dependency dropped — vite 8 pulls it transitively
  only when its optional peer is provided.

### Notes
- PHP/Laravel surface area unchanged. Composer consumers do **not** see any
  behaviour delta; this is a frontend-only chore release. Re-publishing
  exists primarily to keep Packagist's latest tag aligned with `main` after
  PR #4.

## [v1.0.0] — 2026-05-17

### Added
- Initial release scaffold.
- Composer package shell with auto-discovered service provider that mounts the
  SPA under `config('mcp-pack-admin.mount_prefix')` (default `admin/mcp-pack`).
- React 18 + TypeScript + Vite single-page application, pixel-perfect port of
  the Claude Design prototype shipped in `resources/screenshoots/`.
- 12 routes wired through react-router-dom v6:
  - `/dashboard` — live tool-invocation feed, KPI strip, per-server health
    strip, top-tools bar list, recent failures table.
  - `/servers` — filterable + bulk-selectable fleet table with status chips.
  - `/servers/new` — three-step wizard (Identity → Transport → Policies).
  - `/server/:id` — per-server detail with 7 tabs (Overview, Tools,
    Resources, Prompts, Handshakes, Audit, Config).
  - `/tools` and `/tool/:server_id/:name` — global tool matrix + try-it panel.
  - `/resources` — three-pane tree + preview browser.
  - `/prompts` — prompt catalog with argument schemas + previews.
  - `/audit` and `/audit/:auditId` — filtered audit log + drilldown drawer.
  - `/breakers` — circuit-breaker per-(server, tool) matrix.
  - `/playground` — interactive OpenAPI endpoint browser.
  - `/settings` — preferences, tenants, API keys, integrations.
  - `/help` — keyboard shortcuts + tour reference.
- Cmd+K command palette with fuzzy search across servers, tools, audit IDs,
  navigation, and quick actions; `g d/s/t/r/p/a/c` chord shortcuts; `⌘1..7`
  numeric jumps.
- Guided product tour (5 steps) gated on first visit (`mcp_tour_done`
  localStorage marker).
- Dark + light theme via `data-theme` attribute on `<html>` with full design
  token coverage (Indigo Sentinel palette — Inter + JetBrains Mono).
- 15 Playwright E2E specs covering every route.
- 7 Vitest component tests covering the SPA smoke surface + UI primitives.
- 8 PHPUnit tests covering the service provider, route group and Blade shell.
- GitHub Actions CI matrix: PHP 8.3/8.4 × Laravel 11/12/13 + PHP 8.5 × Laravel
  13 (7 cells) + Vitest + Playwright.

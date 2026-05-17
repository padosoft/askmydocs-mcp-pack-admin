# Changelog

All notable changes to `padosoft/askmydocs-mcp-pack-admin` are documented here.
The project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

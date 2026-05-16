# CLAUDE.md — askmydocs-mcp-pack-admin

This file is the AI vibe-coding pack entry point for the package. It mirrors
the convention adopted across the Padosoft fleet (`laravel-flow-admin`,
`laravel-pii-redactor-admin`, `laravel-ai-act-compliance-admin`).

## What this package is

The admin web panel for `padosoft/askmydocs-mcp-pack` v1.4+. A single-page
React + TypeScript application built with Vite, served by a thin Laravel
service provider that registers ONE catch-all route under the configured
mount prefix (default `admin/mcp-pack`).

## Source of truth

- **Design**: the Claude Design prototype bundle stored at
  `<host>/Downloads/askmydocs-mcp-pack-web-panel/project/` was the source for
  the initial port. Future visual changes must NOT diverge from that prototype
  without an explicit decision recorded in `CHANGELOG.md`.
- **Stylesheet**: `resources/css/panel.css` is the verbatim copy of the
  prototype's `styles.css`. Any tweak must preserve the visual output and
  pass the Playwright snapshot specs.
- **Backend API**: the SPA consumes the v1.4 admin REST surface exposed by
  the parent package at `config('mcp-pack-admin.api_base')`. The SPA does
  NOT mock that backend — it talks to the real package routes in production.

## When opening a PR on this repo

1. `npm run build && vendor/bin/phpunit && npx vitest run && npx playwright test` MUST be green locally.
2. Open the PR with `gh pr create --reviewer copilot-pull-request-reviewer ...`
   per R36.
3. Wait for Copilot review comments AND for all CI cells to land.
4. Address every must-fix until the loop terminates (`reviewDecision = APPROVED`
   OR zero outstanding comments) AND every CI check is green.

## Layout

```
src/                      Laravel service provider + controllers
config/mcp-pack-admin.php Mount prefix + middleware + theme defaults
routes/web.php            Catch-all SPA route
resources/views/panel.blade.php  HTML shell — loads Vite manifest
resources/css/panel.css   Verbatim prototype CSS (DO NOT edit ad-hoc)
resources/js/             React + TS source
  main.tsx                Vite entry
  App.tsx                 Top-level shell (Sidebar + Topbar + Routes)
  lib/data.ts             Seed fixtures
  lib/ui.tsx              Icons + primitives (Sparkline, Toast, Modal, …)
  components/shell.tsx    Sidebar, Topbar, Cmd+K palette, Tour
  components/tweaks-panel.tsx  Dev-only tweaks panel (tree-shaken in prod)
  pages/                  One file per route group
tests/                    PHPUnit
tests/js/                 Vitest
frontend/e2e/             Playwright
```

## Slash commands

- `/release-prep` — runs lint + tests + build + sanity checks before tagging.

# AskMyDocs MCP Pack Admin — Web Panel

> **The single pane of glass for every Model Context Protocol server in your Laravel fleet — circuit breakers, tenant-aware audit, and an interactive JSON-RPC playground baked in.**

[![Packagist Version](https://img.shields.io/packagist/v/padosoft/askmydocs-mcp-pack-admin?label=Packagist&style=flat-square)](https://packagist.org/packages/padosoft/askmydocs-mcp-pack-admin)
[![Total Downloads](https://img.shields.io/packagist/dt/padosoft/askmydocs-mcp-pack-admin?style=flat-square)](https://packagist.org/packages/padosoft/askmydocs-mcp-pack-admin)
[![PHP Version](https://img.shields.io/packagist/php-v/padosoft/askmydocs-mcp-pack-admin?style=flat-square)](https://packagist.org/packages/padosoft/askmydocs-mcp-pack-admin)
[![Laravel Version](https://img.shields.io/badge/laravel-13.x-FF2D20?style=flat-square)](https://laravel.com)
[![License](https://img.shields.io/github/license/padosoft/askmydocs-mcp-pack-admin?style=flat-square)](LICENSE)
[![CI](https://github.com/padosoft/askmydocs-mcp-pack-admin/actions/workflows/ci.yml/badge.svg)](https://github.com/padosoft/askmydocs-mcp-pack-admin/actions/workflows/ci.yml)
[![GitHub stars](https://img.shields.io/github/stars/padosoft/askmydocs-mcp-pack-admin?style=social)](https://github.com/padosoft/askmydocs-mcp-pack-admin/stargazers)
[![Open issues](https://img.shields.io/github/issues/padosoft/askmydocs-mcp-pack-admin?style=flat-square)](https://github.com/padosoft/askmydocs-mcp-pack-admin/issues)

> *CI badge note: the workflow is **provisioning** during the v0.x → v1.0 cycle; the badge will flip green as soon as `ci.yml` lands on `main`.*

![AskMyDocs MCP Pack — Web Panel Banner](https://raw.githubusercontent.com/padosoft/askmydocs-mcp-pack-admin/main/resources/AskMyDocs-MCP-Pack-Web-Panel-Banner.png)

---

## 🚀 AI vibe-coding pack — coming with v1.1

The parent package [`padosoft/askmydocs-mcp-pack`](https://github.com/padosoft/askmydocs-mcp-pack)
ships a curated `.claude/` folder with skills, rules, and commands so
Claude Code, Cursor, Copilot, and any other LLM agent can drive the
package productively from day one. This admin SPA will mirror the same
vibe-coding pack — wiring instructions, screenshot routing, audit
queries, breaker sweeps — **in v1.1**. The current v1.0 line focuses on
the SPA + cross-mount integration; the `.claude/` companion is
intentionally not in the v1.0.0 tag so the agent-side docs can be
authored against the *shipped* surface rather than a moving target.

> Why this matters: every Padosoft package converges on the same
> `.claude/` convention so a single LLM session can plumb the entire
> AskMyDocs stack end-to-end — host, mcp-pack, mcp-pack-admin,
> connectors, AI-Act compliance, flow, pii-redactor — without context
> drift between packages.

---

## Table of contents

1. [Why this package exists](#why-this-package-exists)
2. [Features at a glance](#features-at-a-glance)
3. [📸 Screenshots — Admin Web Panel](#-screenshots--admin-web-panel)
4. [Comparison vs alternatives](#comparison-vs-alternatives)
5. [🚀 Quick start (junior-proof, 5 minutes)](#-quick-start-junior-proof-5-minutes)
6. [⚙️ Configuration reference](#%EF%B8%8F-configuration-reference)
7. [🏛️ Architecture](#%EF%B8%8F-architecture)
8. [🔒 Security model](#-security-model)
9. [📖 Operating playbook — three scenarios](#-operating-playbook--three-scenarios)
10. [🗺️ Roadmap](#%EF%B8%8F-roadmap)
11. [🤝 Contributing + community](#-contributing--community)
12. [Sponsors](#sponsors)
13. [License](#license)

---

## Why this package exists

[MCP](https://modelcontextprotocol.io) — the Model Context Protocol —
is now the *de facto* wire format between LLMs and tools. Cursor,
Claude Desktop, VS Code, Cline, Continue, Sourcegraph Cody, the OpenAI
Realtime API, and a long tail of agentic frameworks speak it natively.
Within months of Anthropic's November 2024 release, the public catalog
of MCP servers (Filesystem, GitHub, Slack, Postgres, Notion, Sentry,
Cloudflare, Linear, …) became a viable replacement for hand-rolled
tool stacks.

**The gap:** MCP itself ships no admin UX. Adopters install a Laravel
client package, wire a host bridge, and inherit a black box —
*"Are my upstream servers alive? Which tool calls were authorised this
hour? Why did breaker `(prod, github:search_repositories)` trip? Did
that audit row belong to tenant `acme` or to tenant `globex`?"* —
without an out-of-the-box answer.

**What this admin gives you** — a single, opinionated, tenant-aware,
RBAC-gated SPA that consumes the read-mostly admin REST surface
shipped in `padosoft/askmydocs-mcp-pack` v1.4:

- A **live dashboard** with circuit-breaker tiles, recent audit
  volume, and per-server status.
- A **catalog browser** for every MCP server registered in the host —
  status pills, transport badges, handshake-cached tool list.
- A **per-(server, tool) circuit-breaker view** that reads breaker
  state via `CircuitBreaker::peekState()` — the dashboard never
  consumes the half-open probe slot just by polling.
- A **tenant-scoped audit log** with rich filters
  (`status` ∋ `transport_error`, `server_id`, `tool_name`, `actor`,
  date range), pagination, and redacted-input rendering.
- An **interactive JSON-RPC playground** — `initialize`,
  `tools/list`, `tools/call` — for verifying an upstream server
  without leaving the browser.
- A **prompt catalog** browser (MCP-hosted prompts + templates).
- **Pixel-perfect dark mode parity.**
- **Zero-config cross-mount**: drop the package into any Laravel host
  that already depends on `padosoft/askmydocs-mcp-pack`, and the SPA
  appears under `/admin/mcp/` automatically via composer-extra
  discovery — same pattern as
  [`padosoft/laravel-flow-admin`](https://github.com/padosoft/laravel-flow-admin)
  and
  [`padosoft/laravel-pii-redactor-admin`](https://github.com/padosoft/laravel-pii-redactor-admin).

If you're running MCP in production, this is the operations surface
you were going to build yourself in six weeks. We extracted it from
[AskMyDocs](https://github.com/lopadova/AskMyDocs) v7.0 and shipped it
standalone so you don't have to.

---

## Features at a glance

| ✓ | Capability                                                                                                                                                  |
| - | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 📊 | **Live dashboard** — fleet health tiles, breaker open-count, recent audit volume per server, p50 / p95 / p99 latency at-a-glance.                          |
| 🚦 | **Per-(server, tool) circuit-breaker view** — `closed` / `open` / `half_open` states + manual sweep (force-close after upstream recovery).                  |
| 🧪 | **Interactive JSON-RPC playground** — drive `initialize`, `tools/list`, `tools/call` against any registered server, right in the browser. Fastest possible upstream-validation loop. |
| 🧾 | **Tenant-scoped audit log** (R30 isolation) — paginated, filterable by `status` (incl. `transport_error`), `server_id`, `tool_name`, `actor`, date range. Redacted input + full trace on row drilldown. |
| 🗂️ | **Server catalog** — status pills, transport badges (`stdio` / `http` / `sse`), handshake-cached tool matrix, per-server audit slice.                       |
| 📚 | **Prompt catalog browser** — MCP-hosted `prompts/list` + `prompts/get` rendered as a browsable library.                                                     |
| 🌗 | **Pixel-perfect dark mode** — every screen, every chart, every state.                                                                                       |
| 🔌 | **Cross-mountable** — composer-extra discovery wires the SPA under `/admin/mcp/` with zero host changes.                                                    |
| 👮 | **Spatie roles enforced** — read-only audits for `admin`, mutations gated to `super-admin`. RBAC is enforced server-side; the FE merely renders.            |
| 📡 | **Real-time telemetry feed** — dashboard tiles refresh against the audit table; no polling required for breaker state.                                      |
| 🎛️ | **Built-in feature flags** — toggle tool-calling, breaker, retry policy from the Settings screen; no redeploy.                                              |
| 🧩 | **Source-aware status widening** — accepts `transport_error` + any future package-emitted status value without an FE migration; new states are forward-compatible. |

---

## 📸 Screenshots — Admin Web Panel <a id="-screenshots--admin-web-panel"></a>

Every screen below is a screenshot from the actual `v1.0.0-rc` build —
no mockups, no Figma. The same React bundle ships unchanged into every
host that adopts the package.

![AskMyDocs MCP Pack — Web Panel Banner](https://raw.githubusercontent.com/padosoft/askmydocs-mcp-pack-admin/main/resources/AskMyDocs-MCP-Pack-Web-Panel-Banner.png)

### Dashboard — light + dark mode parity

The landing surface. Live circuit-breaker tiles, recent audit slice,
fleet status at a glance. Dark mode is pixel-perfect: every chart,
every pill, every focus ring.

| Light                                                                                                                                              | Dark                                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ![Dashboard — light](https://raw.githubusercontent.com/padosoft/askmydocs-mcp-pack-admin/main/resources/screenshoots/AskMyDocs-MCP-Pack-Web-Panel-Dashboard.png) | ![Dashboard — dark](https://raw.githubusercontent.com/padosoft/askmydocs-mcp-pack-admin/main/resources/screenshoots/AskMyDocs-MCP-Pack-Web-Panel-Dashboard-dark.png) |

### MCP server catalog

Every MCP server registered in the host, filterable by tenant +
transport + status. Status pills + transport badges + per-server
audit slice — one click away.

![MCP servers catalog](https://raw.githubusercontent.com/padosoft/askmydocs-mcp-pack-admin/main/resources/screenshoots/AskMyDocs-MCP-Pack-Web-Panel-Servers.png)

### Per-server drilldown — handshake, capabilities, tool matrix

The cached `initialize` + `tools/list` response, rendered as a
human-readable tool matrix. No need to `curl` the upstream server to
inspect its capabilities.

![Per-server detail](https://raw.githubusercontent.com/padosoft/askmydocs-mcp-pack-admin/main/resources/screenshoots/AskMyDocs-MCP-Pack-Web-Panel-Server-details.png)

### Per-server audit timeline

Audit slice scoped to a single server, with the same R30 tenant
isolation that gates every other query in the panel.

![Per-server audit](https://raw.githubusercontent.com/padosoft/askmydocs-mcp-pack-admin/main/resources/screenshoots/AskMyDocs-MCP-Pack-Web-Panel-Server-details-audit.png)

### Global tool matrix

Every tool across every server, in one searchable table. Useful when
you need to answer *"which servers expose a `search` tool?"* in 5
seconds, not 5 minutes.

![Global tool matrix](https://raw.githubusercontent.com/padosoft/askmydocs-mcp-pack-admin/main/resources/screenshoots/AskMyDocs-MCP-Pack-Web-Panel-Tools.png)

### Audit log browser — full surface

Paginated audit query over the configurable
`mcp-pack.audit_model`, tenant-scoped by default. Filters:
`status` (incl. `transport_error`), `server_id`, `tool_name`,
`actor`, date range.

![Audit log browser](https://raw.githubusercontent.com/padosoft/askmydocs-mcp-pack-admin/main/resources/screenshoots/AskMyDocs-MCP-Pack-Web-Panel-Audit-logs.png)

### Audit row drilldown — redacted input + full trace

Click any audit row for the SHA-256 input/output hashes, redacted
input excerpt, full duration, and error excerpt — exactly the trail
an EU AI-Act audit will ask for.

![Audit row detail](https://raw.githubusercontent.com/padosoft/askmydocs-mcp-pack-admin/main/resources/screenshoots/AskMyDocs-MCP-Pack-Web-Panel-Audit-logs-details.png)

### Circuit-breaker control room

Per-(server, tool) breaker state with manual sweep. Read via
`CircuitBreaker::peekState()` so the dashboard NEVER consumes the
half-open probe slot just by polling.

![Circuit breakers](https://raw.githubusercontent.com/padosoft/askmydocs-mcp-pack-admin/main/resources/screenshoots/AskMyDocs-MCP-Pack-Web-Panel-Circuit-Breakers.png)

### Interactive JSON-RPC playground

`initialize`, `tools/list`, `tools/call` — drive any registered MCP
server from the browser. Auth-aware, tenant-scoped, audit-logged.
Fastest way to validate that the upstream server you just spun up is
actually reachable from inside the host.

![API playground](https://raw.githubusercontent.com/padosoft/askmydocs-mcp-pack-admin/main/resources/screenshoots/AskMyDocs-MCP-Pack-Web-Panel-API-playground.png)

### Prompt catalog

JSON-RPC `prompts/list` + `prompts/get` rendered as a browsable
library — every MCP-hosted prompt template, one click away from being
copy-pasted into the host chat.

![Prompt catalog](https://raw.githubusercontent.com/padosoft/askmydocs-mcp-pack-admin/main/resources/screenshoots/AskMyDocs-MCP-Pack-Web-Panel-Prompt.png)

### Settings — feature flags + retry/breaker config

Mirrors the `mcp-pack.*` config block. Toggle tool-calling, the
circuit breaker, the retry budget; tune
`MCP_PACK_CB_FAILURE_THRESHOLD` and friends — without a redeploy
when the operator is logged in as `super-admin`.

![Settings](https://raw.githubusercontent.com/padosoft/askmydocs-mcp-pack-admin/main/resources/screenshoots/AskMyDocs-MCP-Pack-Web-Panel-Settings.png)

---

## Comparison vs alternatives

| Capability                              | **padosoft/askmydocs-mcp-pack-admin**         | Anthropic `mcp-inspector`                    | Building from scratch                          |
| --------------------------------------- | --------------------------------------------- | -------------------------------------------- | ---------------------------------------------- |
| Targets                                 | Production Laravel hosts (tenant fleets)      | Local developer machine (single MCP server)  | Whatever you ship                              |
| Tenant isolation (R30)                  | ✅ enforced server-side on every query        | ❌ not a multi-tenant tool                    | DIY (audit + RBAC + scopes)                    |
| Live circuit-breaker dashboard          | ✅ per-(server, tool), `peekState()`-safe     | ❌ no concept of breaker                      | DIY (Redis + dashboard + manual sweep)         |
| Tenant-scoped audit log                 | ✅ paginated, filtered, redacted-input render | ❌ no persistence                             | DIY (table + retention + filters)              |
| Interactive JSON-RPC playground         | ✅ `initialize` / `tools/list` / `tools/call` | ✅ standalone web app                         | DIY (~ 400 LOC React)                          |
| Pixel-perfect dark mode                 | ✅                                            | partial                                      | DIY                                            |
| Cross-mount into any Laravel host       | ✅ composer-extra discovery                   | n/a — desktop tool                           | DIY (route registration + asset publish)       |
| Spatie roles + super-admin write gating | ✅ `admin` read, `super-admin` mutate         | ❌                                            | DIY                                            |
| Real-time tool-call telemetry feed      | ✅                                            | partial                                      | DIY                                            |
| Operator-tunable feature flags          | ✅ Settings screen                            | ❌                                            | DIY                                            |
| Production-ready (RBAC, audit, R30)     | ✅                                            | ❌ — `mcp-inspector` is a dev-time tool       | DIY                                            |
| License                                 | Apache-2.0                                    | MIT                                          | n/a                                            |

> `mcp-inspector` is excellent for **local debugging** of a single MCP
> server you're writing — it ships from the upstream MCP project and
> we recommend it whenever you're authoring a brand new server. This
> admin is **complementary**, not competitive: it answers a different
> question (*"how is my fleet doing right now, across every tenant?"*)
> and lives in a different operational tier (production, audit,
> RBAC).

---

## 🚀 Quick start (junior-proof, 5 minutes) <a id="-quick-start-junior-proof-5-minutes"></a>

This walkthrough assumes you have **never** touched MCP. Each step is
a single command you can copy-paste verbatim.

### Prerequisites

| You need                                                                                  | Why                                                          |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| PHP **8.3+** (`php -v`)                                                                   | The package targets PHP 8.3 minimum.                         |
| Composer **2.5+** (`composer --version`)                                                  | For the actual install.                                      |
| A working **Laravel 13.x** application (`php artisan --version` → `Laravel Framework 13.*`) | The SPA cross-mounts into your existing host.                |
| `padosoft/askmydocs-mcp-pack` **v1.4 or newer** already installed                         | The admin SPA consumes the v1.4 admin REST surface.          |
| Spatie laravel-permission                                                                 | The admin uses `admin` and `super-admin` roles.              |
| A super-admin user                                                                        | To log in and operate the panel.                             |

### Step 1 — install the parent package (if not yet present)

```bash
composer require padosoft/askmydocs-mcp-pack:^1.4
php artisan vendor:publish --tag=mcp-pack-config
php artisan vendor:publish --tag=mcp-pack-migrations
php artisan migrate
```

Confirm it's wired by pinging the registry:

```bash
php artisan mcp-pack:ping
```

You should see a per-server status table. If the table is empty,
[register at least one MCP server first](https://github.com/padosoft/askmydocs-mcp-pack#quick-start-3-minutes)
— the admin SPA will be empty otherwise.

### Step 2 — install this admin package

```bash
composer require padosoft/askmydocs-mcp-pack-admin:^1.0
```

The service provider is auto-discovered via
`composer.json::extra.laravel.providers`. Nothing to register by
hand.

### Step 3 — publish the SPA bundle

```bash
php artisan vendor:publish --tag=mcp-pack-admin-assets
```

> *Ships in v1.0.0. The `mcp-pack-admin-assets` tag publishes the
> precompiled React bundle (JS + CSS + favicons) under
> `public/vendor/mcp-pack-admin/`. No `npm` / `vite` required on the
> host — the SPA is shipped pre-built so a production deploy is a
> single `composer require`.*

### Step 4 — run migrations (if any)

```bash
php artisan migrate
```

The admin package itself does **not** ship migrations — it consumes
the `mcp_tool_call_audit` table already owned by
`padosoft/askmydocs-mcp-pack`. The `migrate` step is included here
only so that consumers running through the walkthrough don't miss a
parent-package migration that may have landed since the last deploy.

### Step 5 — log in and open the panel

Navigate your browser to:

```
https://your-host.local/admin/mcp/
```

Log in with a user that has the `super-admin` Spatie role. You should
land on the **Dashboard** screen with circuit-breaker tiles and the
recent audit slice.

### Step 6 — verify with a single `curl`

The fastest sanity check that the BE is wired (without opening the
browser):

```bash
curl -s -H "Accept: application/json" \
     -H "Cookie: laravel_session=<your-session-cookie>" \
     https://your-host.local/api/admin/mcp-tool-call-audit \
     | jq '. | {data_count: (.data|length), meta: .meta}'
```

Expected response shape:

```json
{
  "data_count": 25,
  "meta": {
    "current_page": 1,
    "last_page": 4,
    "per_page": 25,
    "total": 92
  }
}
```

If `data_count > 0` and `meta.total` matches the audit table row
count, the BE is wired correctly and the SPA will render.

### Troubleshooting

| Symptom                                                          | Likely cause                                                  | Fix                                                                                                                  |
| ---------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `404 Not Found` at `/admin/mcp/`                                 | Service-provider auto-discovery disabled in the host          | Add the package SP manually to `config/app.php` `providers[]`.                                                       |
| `403 Forbidden` after login                                      | User lacks `admin` or `super-admin` role                      | `$user->assignRole('super-admin');` then re-login (or clear the session).                                            |
| Blank white page at `/admin/mcp/`                                | SPA bundle never published                                    | Re-run `php artisan vendor:publish --tag=mcp-pack-admin-assets --force`.                                             |
| Mixed-content / asset-404 errors                                 | `APP_URL` mismatch between host and reverse-proxy             | Set `APP_URL=https://your-host.local` in `.env` and re-run `php artisan config:cache`.                                |
| `/api/admin/mcp-tool-call-audit` returns `[]` but the dashboard is empty | No tool calls have happened yet                       | Run `php artisan mcp-pack:ping --tenant=acme` first, then drive a chat turn through `McpToolCallingService::chatWithTools()`. |
| `transport_error` rows pile up                                   | Upstream MCP server unreachable                               | Inspect the audit row → use the **API playground** to re-drive `initialize` against the server and watch the response. |

If none of the above resolves your symptom, open a discussion at
[github.com/padosoft/askmydocs-mcp-pack-admin/discussions](https://github.com/padosoft/askmydocs-mcp-pack-admin/discussions)
with the output of `php artisan about` and the relevant
`/admin/mcp/*` response body.

---

## ⚙️ Configuration reference <a id="%EF%B8%8F-configuration-reference"></a>

The admin SPA inherits **most** of its behaviour from the parent
package. The knobs below are the ones that are specific to the admin
mount.

| Key                                       | Env var                              | Default        | Purpose                                                                                                       |
| ----------------------------------------- | ------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------- |
| `mcp_pack_admin.mount_path`               | `MCP_PACK_ADMIN_MOUNT_PATH`          | `/admin/mcp`   | Where the SPA mounts. Change if your host already owns `/admin/mcp` for another tool.                         |
| `mcp_pack_admin.require_role`             | `MCP_PACK_ADMIN_REQUIRE_ROLE`        | `admin`        | Minimum Spatie role required to *read*. Mutations are always gated to `super-admin` regardless of this knob.  |
| `mcp_pack_admin.write_require_role`       | `MCP_PACK_ADMIN_WRITE_REQUIRE_ROLE`  | `super-admin`  | Role required for circuit-breaker sweeps, settings writes, and playground `tools/call` invocations.           |
| `mcp_pack_admin.audit_default_page_size`  | `MCP_PACK_ADMIN_AUDIT_PAGE_SIZE`     | `25`           | Default pagination size on the audit log browser. Capped server-side at `100`.                                |
| `mcp_pack_admin.theme.default`            | `MCP_PACK_ADMIN_THEME_DEFAULT`       | `system`       | `system` / `light` / `dark`. Per-user override is persisted in `localStorage`.                                |
| `mcp_pack_admin.feature_flags.playground` | `MCP_PACK_ADMIN_PLAYGROUND_ENABLED`  | `true`         | Master switch for the JSON-RPC playground. Set `false` in strict-security environments where ops should not   |
|                                           |                                      |                | be able to invoke `tools/call` from the panel.                                                                |
| `mcp_pack_admin.feature_flags.prompts`    | `MCP_PACK_ADMIN_PROMPTS_ENABLED`     | `true`         | Hide the Prompts screen if the host does not use MCP-hosted prompts.                                          |
| `mcp_pack_admin.circuit_breaker_sweep`    | `MCP_PACK_ADMIN_CB_SWEEP_ENABLED`    | `true`         | Hide the manual breaker-sweep button if the host wants automated-recovery-only.                               |

All keys default to a working configuration. If you publish nothing,
the SPA mounts at `/admin/mcp/`, requires `admin` to read,
`super-admin` to write, paginates audit rows in chunks of 25, and
ships every feature toggled on.

To publish the config file so you can override these in
`config/mcp-pack-admin.php`:

```bash
php artisan vendor:publish --tag=mcp-pack-admin-config
```

> *The `mcp-pack-admin-config` tag, the `mount_path` rewrite, and the
> feature-flag toggles all ship in v1.0.0. The v0.x scaffold currently
> documented here is for community visibility ahead of GA.*

---

## 🏛️ Architecture <a id="%EF%B8%8F-architecture"></a>

```
┌───────────────────────────────────────────────────────────────────────────────┐
│  Operator browser                                                             │
│    │                                                                          │
│    └─► https://your-host.local/admin/mcp/                                     │
│           │                                                                   │
│           │  (SPA — React, precompiled, served from public/vendor/...)        │
│           │                                                                   │
│           ├─► GET   /api/admin/mcp-pack/servers          ─── catalog          │
│           ├─► GET   /api/admin/mcp-pack/servers/{id}     ─── detail           │
│           ├─► GET   /api/admin/mcp-tool-call-audit       ─── audit log        │
│           ├─► GET   /api/admin/mcp-pack/circuit-breaker  ─── breaker state    │
│           ├─► POST  /api/admin/mcp-pack/circuit-breaker/sweep   (super-admin) │
│           ├─► POST  /api/admin/mcp-pack/playground/initialize   (super-admin) │
│           ├─► POST  /api/admin/mcp-pack/playground/tools-list   (super-admin) │
│           └─► POST  /api/admin/mcp-pack/playground/tools-call   (super-admin) │
│                                                                               │
│        (All routes shipped by padosoft/askmydocs-mcp-pack v1.4.)              │
│        (Auth: Sanctum + Spatie role middleware. Tenant scope: R30.)           │
└───────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │
┌──────────────────────────────────────▼────────────────────────────────────────┐
│  Host Laravel application                                                     │
│    │                                                                          │
│    ├─► padosoft/askmydocs-mcp-pack v1.4+                                      │
│    │     ├─► McpServerRegistryContract::forTenant($id)                        │
│    │     ├─► McpHandshakeService (cached 5min)                                │
│    │     ├─► McpToolCallingService (multi-turn loop, budget cap)              │
│    │     ├─► ToolInvoker (CircuitBreaker + RetryBudget, opt-in)               │
│    │     └─► McpToolCallAudit (SHA-256 hashed audit trail)                    │
│    │                                                                          │
│    └─► padosoft/askmydocs-mcp-pack-admin (this package)                       │
│          ├─► ServiceProvider — auto-discovered                                │
│          ├─► Route registrar — mounts /admin/mcp/* under host's auth          │
│          ├─► Asset publisher — copies the React bundle into public/...        │
│          └─► Config — mount_path, role gates, feature flags                   │
└───────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       │  (host's chat flow drives JSON-RPC traffic)
                                       │
┌──────────────────────────────────────▼────────────────────────────────────────┐
│  Upstream MCP servers (stdio child processes OR HTTP/SSE gateways)            │
│    ├─► Filesystem / GitHub / Slack / Postgres / Notion / Sentry / Linear /…   │
│    └─► Any server that speaks JSON-RPC 2.0 over the chosen transport          │
└───────────────────────────────────────────────────────────────────────────────┘
```

**Cross-mount pattern.** The admin package follows the same recipe as
[`padosoft/laravel-flow-admin`](https://github.com/padosoft/laravel-flow-admin)
and
[`padosoft/laravel-pii-redactor-admin`](https://github.com/padosoft/laravel-pii-redactor-admin):

1. The host has a single base SPA shell (or even no SPA at all — the
   admin can mount on a fresh Laravel app).
2. The admin package's `composer.json` declares an `extra.askmydocs.admin-mount`
   block with the route prefix and the precompiled-asset path.
3. The base host (or its admin shell, if it has one) reads
   `composer-extra` at boot and registers the route + serves the
   bundle.
4. Authentication is **always** inherited from the host — the admin
   package never owns a login screen.
5. Authorization is enforced server-side on every route by the parent
   `padosoft/askmydocs-mcp-pack` v1.4 middleware stack.

The blast radius of bumping the parent package is bounded by the v1.x
REST contract; the admin SPA does not couple to any internal class.

---

## 🔒 Security model <a id="-security-model"></a>

The admin is designed to ship in a *production tenant* without an
extra security review. Five concentric gates:

1. **Network** — the SPA only loads where the host's web routes load.
   If your host is behind Cloudflare Access / a corporate VPN / an SSH
   tunnel, so is the admin.
2. **Authentication** — Laravel's `web` middleware + Sanctum. The
   admin owns no login screen.
3. **Read authorisation** — `MCP_PACK_ADMIN_REQUIRE_ROLE` (default
   `admin`). Enforced by the parent package's middleware on every
   admin REST route.
4. **Write authorisation** — `MCP_PACK_ADMIN_WRITE_REQUIRE_ROLE`
   (default `super-admin`). Mutations (breaker sweeps, playground
   `tools/call`, settings writes) ALWAYS check this independently of
   the read role.
5. **Tenant isolation (R30)** — every query in the admin REST surface
   passes through `forTenant($ctx->current())`. Cross-tenant leakage is
   structurally impossible; the FE never even sees other tenants' rows.

Audit-wise, every mutation issued from the panel produces an audit
row with `actor` set to the operator's user id. Playground
`tools/call` invocations are audit-logged the same way a host-driven
chat-flow tool call is — there's no privileged back-door.

---

## 📖 Operating playbook — three scenarios

Three real-world stories that show how the SPA collapses a long
operator workflow into seconds. None of them require touching code in
the host — every action below is a click in the panel.

### Scenario A — "the GitHub MCP server is misbehaving"

The on-call gets paged: `(prod, github:search_repositories)` is
returning `transport_error` at a rate of ~5 req/min.

1. Open `/admin/mcp/` → Dashboard. The breaker tile for
   `github:search_repositories` is red.
2. Click the tile → Circuit Breakers screen, scoped to that
   `(server, tool)` pair. The recent failure trace is one click away.
3. Open the **API playground** in a second tab → run `tools/list`
   against `github`. Confirms the handshake itself is healthy.
4. Run `tools/call` for `search_repositories` with a known-good
   query. Observe the upstream error message verbatim — *"GitHub PAT
   expired"*.
5. Rotate the PAT in the host's secrets store, restart the worker
   pool. Wait for the breaker to drain through `half_open`.
6. Click **Manual sweep** to force the breaker back to `closed`
   immediately. The audit log on the next page now shows clean
   `tools/call` rows.

Time-to-resolve, end-to-end: under three minutes.

### Scenario B — "an auditor wants every Slack tool call from the last 30 days"

The compliance team needs a tenant-scoped CSV of every tool call to
the Slack MCP server in the last 30 days, scoped to tenant `acme`.

1. Open `/admin/mcp/` → Audit Logs.
2. Filter: `server_id = slack`, `tenant_id = acme`, date range
   `now - 30d` → `now`. The pagination updates immediately.
3. Click any row → confirm the rendered fields are the
   compliance-ready set: timestamp, actor, tool name, status,
   duration, SHA-256 of redacted input + output, error excerpt.
4. (In v1.0.0) click **Export CSV** at the top of the filtered view
   — the file streams directly to the operator's browser.

The R30 tenant scope is enforced server-side; an operator working
inside `acme` literally cannot see `globex` rows, even by URL-tampering.

### Scenario C — "a new developer wants to verify their freshly-spun-up Filesystem MCP server"

A junior just registered a stdio Filesystem MCP server in the host
config.

1. Open `/admin/mcp/` → Servers. The new server appears with status
   pill `unknown` (no handshake yet).
2. Click the server → Per-server detail. Click **Refresh handshake**
   (top right). The panel POSTs to the playground `initialize`
   endpoint, the cached handshake updates, the tool matrix populates.
3. The junior expands the tool matrix → reads tool descriptions +
   JSON schemas without ever needing to `cat` the server's
   `tools/list` output by hand.
4. Optionally, the junior runs `tools/call` for `read_file` from the
   playground to validate end-to-end I/O before wiring the server
   into a chat flow.

The whole loop is reproducible from any browser in the office, no SSH
required.

---

## 🗺️ Roadmap <a id="%EF%B8%8F-roadmap"></a>

| Version  | Status                    | Highlights                                                                                                                                              |
| -------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v0.x     | ✅ scaffold + screenshots | This repo. Banner, screenshots, README, repo skeleton. Source code lands in v1.0.0.                                                                     |
| v1.0.0   | ⏳ planned                | Initial release. React SPA bundle + service provider + asset publisher + composer-extra cross-mount. Full coverage of the v1.4 admin REST surface.      |
| v1.0.1   | ⏳ planned                | `.claude/` vibe-coding pack mirrored from the parent package + Playwright E2E covering every screen in this README + Italian + English copy.            |
| v1.1.0   | ⏳ planned                | **Chat-time tool-call inspector** — drilldown that ties an audit row back to the host chat message that produced it (when the host wires the linkback). |
| v1.2.0   | ⏳ planned                | **Prometheus exporter** — `/admin/mcp/metrics` exposes breaker state + audit volume + p95 latency in Prometheus text format.                            |
| v1.3.0   | ⏳ planned                | **Per-tool ACL editor** — manage `allowedTools` per `(tenant, server)` from the panel (writes through a v1.5 parent-package writable registry contract).|
| v2.0.0   | ⏳ planned                | **Multi-cluster control plane** — manage MCP fleets across multiple Laravel hosts from one panel. Single-binary or single-image deploy.                 |

The v1.x line is **strictly additive** — every screen, every REST
contract, every CSS variable, every test-id is part of the public
API. We don't break consumers between minors.

---

## 🤝 Contributing + community <a id="-contributing--community"></a>

Issues, discussions, and PRs are very welcome. Until this repo grows
its own `CONTRIBUTING.md`, the upstream community policy from the
parent package applies verbatim:

- **Code style**: PSR-12 + Pint for PHP, Prettier + ESLint for the
  React SPA.
- **Tests**: every PR that touches a screen ships a Playwright
  scenario (happy path + at least one failure path); every PR that
  touches the BE wiring ships a feature test against the v1.4 REST
  routes.
- **Commits**: Conventional Commits (`docs(...)`, `feat(...)`,
  `fix(...)`, `chore(...)`).
- **PR review**: GitHub Copilot is requested on every PR; we don't
  merge until Copilot is happy AND CI is green AND a human reviewer
  has approved.

See
[`padosoft/askmydocs-mcp-pack/CONTRIBUTING.md`](https://github.com/padosoft/askmydocs-mcp-pack/blob/main/CONTRIBUTING.md)
for the full policy.

Have a question, a use case, or a complaint? Open a
[Discussion](https://github.com/padosoft/askmydocs-mcp-pack-admin/discussions)
or an [Issue](https://github.com/padosoft/askmydocs-mcp-pack-admin/issues).
We respond to most threads within 48 hours.

---

## Sponsors

If your team uses this package in production, please consider
sponsoring Padosoft on
[GitHub Sponsors](https://github.com/sponsors/padosoft). Sponsorship
funds the v1.x → v2 roadmap and the surrounding
[AskMyDocs](https://github.com/lopadova/AskMyDocs) platform.

---

## License

Apache License 2.0 © [Padosoft](https://github.com/padosoft). See
[LICENSE](LICENSE) for the full text.

---

> **Related packages**
> - [`padosoft/askmydocs-mcp-pack`](https://github.com/padosoft/askmydocs-mcp-pack) — the parent: contracts, orchestrator, transports, audit trail, circuit breaker, admin REST routes.
> - [`padosoft/laravel-flow`](https://github.com/padosoft/laravel-flow) + [`padosoft/laravel-flow-admin`](https://github.com/padosoft/laravel-flow-admin) — the workflow engine and its admin SPA companion (same cross-mount pattern as this package).
> - [`padosoft/laravel-pii-redactor`](https://github.com/padosoft/laravel-pii-redactor) + [`padosoft/laravel-pii-redactor-admin`](https://github.com/padosoft/laravel-pii-redactor-admin) — PII redaction with reversible tokenization, and its admin SPA.
> - [`padosoft/laravel-ai-act-compliance`](https://github.com/padosoft/laravel-ai-act-compliance) + [`padosoft/laravel-ai-act-compliance-admin`](https://github.com/padosoft/laravel-ai-act-compliance-admin) — EU AI Act compliance pack, and its admin SPA.
> - [`lopadova/AskMyDocs`](https://github.com/lopadova/AskMyDocs) — the host platform that drove every package above into existence.

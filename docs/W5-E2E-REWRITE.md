# v1.1.x — Real-backend Playwright suite rewrite

**Tracking doc** for the deferred W5 work parked at v1.1.0 GA.

## Why this was parked

v1.1.0 ships:

- Live API client (axios + Sanctum XSRF) → W2
- 22 endpoints typed end-to-end → W2
- 13 read hooks + 10 mutation hooks wiring every page surface → W2/W3/W4
- R21 two-call confirm-token protocol with expired-token guard → W4
- SSE live-feed consumer replacing the prototype simulator → W4
- **154 Vitest specs** covering every page-level API binding using
  MSW handlers shaped to the real wire schema

The orthogonal piece — rewriting the prototype's 12 Playwright specs
to drive against a real Laravel testbench host — is **infrastructure
work** that the v1.1.0 GA functionally doesn't depend on (Vitest +
MSW already proves the wire-up). To stop the cycle from stretching
indefinitely, those specs were parked under
`frontend/e2e-pending-v1.1.x/` and CI runs the new `smoke.spec.ts`
instead.

## What v1.1.x must deliver

1. **Testbench-style Laravel host** under `tests/E2E/Host/` that
   composer-requires `padosoft/askmydocs-mcp-pack:^1.5` so its
   `/api/admin/mcp-pack/*` routes auto-register. Use Orchestra
   Testbench's existing setup pattern (see `tests/TestCase.php`).
2. **`tests/E2E/Seeders/E2EDemoSeeder.php`** seeding a deterministic
   dataset:
   - 3 servers: `e2e-server-ok` (status=ok), `e2e-server-warn` (warn),
     `e2e-server-err` (err) — varied transports (http/stdio/sse).
   - ~10 tools across the 3 servers, with `input_schema` declarations.
   - ~15 audit rows with the v1.5 wire shape
     (`mcp_server_name`, `tool_name`, `duration_ms`, `created_at`,
     `tenant_id`).
   - 3 circuit breakers (one each: open / half_open / closed).
   - A resource tree + prompt list per server.
3. **`/testing/reset` + `/testing/seed`** controllers gated on
   `APP_ENV=testing` for Playwright fixture isolation.
4. **Auth bypass** scoped to `APP_ENV=testing`: a middleware that
   auto-authenticates a fixed `e2e-admin` user inside a
   `tenant_id=e2e-default` tenant. Production paths NEVER hit this.
5. **R38-compliant workflow step**: `php artisan migrate:fresh
   --force` + `php artisan db:seed --class=E2EDemoSeeder` run as a
   CLI step BEFORE Playwright starts (NOT behind `php artisan serve`
   on every `/testing/reset`).
6. **Spec rewrites** for all 12 files in
   `frontend/e2e-pending-v1.1.x/`, bringing them back to
   `frontend/e2e/` one-by-one with assertions against the deterministic
   seeder dataset.
7. **W4 write-path E2E coverage** (additive to the rewrites):
   - Server CRUD wizard (3 steps) → success + 422 validation.
   - ToolPlayground R21 two-call → success + expired-token failure.
   - AuditDrilldown Replay R21 → success + confirmation_invalid.
   - BreakersPage Reset R21 → open → reset → closed.
   - SSE live-feed → trigger tool invoke, assert event arrives within
     5s on the dashboard.
8. **`scripts/verify-e2e-real-data.sh`** (adapted from the
   AskMyDocs main-repo gate) greps `page.route(` across
   `frontend/e2e/` and fails CI on any unallowlisted internal
   interception (R13).

## Scope estimate

~25 files of new code + 12 spec rewrites. Estimated 1-2 days of
focused work. Should ship as v1.1.1 or v1.1.2 (semver patch — pure
test infra + a few CI workflow lines, no public API changes).

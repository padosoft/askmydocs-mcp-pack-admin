# Parked Playwright specs — v1.1.x real-backend rewrite

These 12 spec files were written against the prototype's bundled
fixture data (`resources/js/lib/data.ts`). After v1.1.0/W3+W4 wired
the SPA to live `padosoft/askmydocs-mcp-pack` v1.5 endpoints, every
assertion against fixture seed names (`openai-mcp`, `github-mcp`,
`delete-all`, etc.) became fixture-drift — the live API has no such
data.

For v1.1.0 GA we **parked** the suite here (out of Playwright's
`testDir`) so CI runs the new `frontend/e2e/smoke.spec.ts` instead.
Page-level wire-up is covered by **154 Vitest specs** under
`tests/js/` using MSW mocks of the real wire shape.

## v1.1.x rewrite plan

See [`docs/W5-E2E-REWRITE.md`](../../docs/W5-E2E-REWRITE.md) for the
full plan: testbench-style Laravel host that composer-requires
`padosoft/askmydocs-mcp-pack:^1.5`, deterministic `E2EDemoSeeder`,
`/testing/reset` + `/testing/seed` test-only endpoints, R38-compliant
CLI migrate+seed step before Playwright boots, real-backend Sanctum
auth bypass scoped to `APP_ENV=testing`.

Each spec in this directory will be brought back one-by-one once the
host harness is in place, replacing fixture seed names with the
deterministic seeder dataset (`e2e-server-ok`, `e2e-server-warn`,
`e2e-server-err`, `e2e-tool-{slug}`, etc.).

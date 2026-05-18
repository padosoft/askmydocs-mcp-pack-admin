// Minimal smoke test — verifies the SPA bundle loads, the top-level
// landmarks render, and the four primary nav targets are reachable.
//
// This is intentionally narrow: the production-grade Playwright suite
// (which exercises the real `padosoft/askmydocs-mcp-pack` backend
// end-to-end) is parked under `frontend/e2e-pending-v1.1.x/` and will
// be rewritten + re-enabled in a v1.1.x patch — see
// `docs/W5-E2E-REWRITE.md` for the plan.
//
// Until then this smoke spec is the only Playwright signal in CI,
// while the page-level wire-up is covered by 154 Vitest specs under
// `tests/js/` (every endpoint binding has loading / error / empty /
// ready coverage via MSW mocks of the real wire shape).

import { test, expect } from '@playwright/test';
import { dismissTour } from './global-setup';

test.beforeEach(async ({ page }) => {
  await dismissTour(page);
});

test('SPA bundle mounts and the primary sidebar nav is reachable', async ({ page }) => {
  await page.goto('/');
  // The sidebar carries the load-bearing navigation. We don't assert on
  // any API-driven content because that requires a live backend (W5 work).
  await expect(page.getByText('Dashboard').first()).toBeVisible();
  await expect(page.getByText('Servers').first()).toBeVisible();
  await expect(page.getByText('Tools').first()).toBeVisible();
  await expect(page.getByText('Audit log').first()).toBeVisible();
});

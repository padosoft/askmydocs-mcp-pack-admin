// Shared test setup helper — apply via `test.use({ storageState: ... })` if
// needed, or run inline in each spec via `await dismissTour(page)`.
import type { Page } from '@playwright/test';

export async function dismissTour(page: Page) {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('mcp_tour_done', '1');
    } catch {
      /* ignore */
    }
  });
}

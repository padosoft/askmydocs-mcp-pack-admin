import { test, expect } from '@playwright/test';
import { dismissTour } from './global-setup';
test.beforeEach(async ({ page }) => { await dismissTour(page); });

test('playground page renders the OpenAPI endpoint list', async ({ page }) => {
  await page.goto('/playground');

  await expect(page.getByText('/api/admin/mcp-pack/servers').first()).toBeVisible();
  await expect(page.getByText(/handshake/i).first()).toBeVisible();
});

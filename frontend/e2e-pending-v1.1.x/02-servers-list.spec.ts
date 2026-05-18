import { test, expect } from '@playwright/test';
import { dismissTour } from './global-setup';
test.beforeEach(async ({ page }) => { await dismissTour(page); });

test('servers list renders the seed fleet', async ({ page }) => {
  await page.goto('/servers');

  await expect(page.getByRole('heading', { name: 'Servers', level: 1 })).toBeVisible();

  // Seed fleet samples
  await expect(page.getByText('openai-mcp').first()).toBeVisible();
  await expect(page.getByText('github-mcp').first()).toBeVisible();
  await expect(page.getByText('pinecone-vectors').first()).toBeVisible();

  // The status chip strip is present
  await expect(page.locator('.chip').filter({ hasText: 'Errored' }).first()).toBeVisible();
});

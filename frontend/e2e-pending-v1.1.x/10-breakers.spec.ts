import { test, expect } from '@playwright/test';
import { dismissTour } from './global-setup';
test.beforeEach(async ({ page }) => { await dismissTour(page); });

test('circuit breakers page renders the per-(server, tool) matrix', async ({ page }) => {
  await page.goto('/breakers');

  // Each seed breaker references the server name → look for the two open ones.
  await expect(page.getByText('slack-mcp').first()).toBeVisible();
  await expect(page.getByText('pinecone-vectors').first()).toBeVisible();
});

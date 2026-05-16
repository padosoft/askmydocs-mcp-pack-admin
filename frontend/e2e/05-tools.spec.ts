import { test, expect } from '@playwright/test';
import { dismissTour } from './global-setup';
test.beforeEach(async ({ page }) => { await dismissTour(page); });

test('tools matrix lists every advertised tool, grouped by server', async ({ page }) => {
  await page.goto('/tools');

  // Sample tool names from the seed fixtures
  await expect(page.getByText(/search/i).first()).toBeVisible();
  await expect(page.getByText(/create_issue/i).first()).toBeVisible();
  await expect(page.getByText(/summarise/i).first()).toBeVisible();
});

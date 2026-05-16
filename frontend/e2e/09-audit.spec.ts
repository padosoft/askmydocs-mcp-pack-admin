import { test, expect } from '@playwright/test';
import { dismissTour } from './global-setup';
test.beforeEach(async ({ page }) => { await dismissTour(page); });

test('audit log page renders rows from the seed fixtures', async ({ page }) => {
  await page.goto('/audit');

  await expect(page.getByRole('heading', { name: /Audit log/i, level: 1 })).toBeVisible();

  // The seed always has at least one tools/call row visible after first paint.
  await expect(page.getByText('tools/call').first()).toBeVisible();
});

test('audit drilldown opens the drawer over /audit/:id', async ({ page }) => {
  await page.goto('/audit/aud_search_142ms');

  await expect(page.getByText('aud_search_142ms').first()).toBeVisible();
});

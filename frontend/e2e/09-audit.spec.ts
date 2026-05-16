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

test('audit drilldown surfaces the fixture banner when id has no real record', async ({ page }) => {
  await page.goto('/audit/aud_does_not_exist_in_seed');

  await expect(page.getByTestId('audit-drilldown-fixture-banner')).toBeVisible();
  await expect(page.getByTestId('audit-drilldown-fixture-banner')).toContainText('aud_does_not_exist_in_seed');
});

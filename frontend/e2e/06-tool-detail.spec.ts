import { test, expect } from '@playwright/test';
import { dismissTour } from './global-setup';
test.beforeEach(async ({ page }) => { await dismissTour(page); });

test('tool detail deep-link shows the tool playground for one tool', async ({ page }) => {
  await page.goto('/tool/srv_02/create_issue');

  // Should have selected the tool in the explorer
  await expect(page.getByText(/create_issue/i).first()).toBeVisible();
});

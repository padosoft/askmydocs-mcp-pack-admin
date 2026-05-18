import { test, expect } from '@playwright/test';
import { dismissTour } from './global-setup';
test.beforeEach(async ({ page }) => { await dismissTour(page); });

test('prompts catalog renders the seed prompts', async ({ page }) => {
  await page.goto('/prompts');

  await expect(page.getByText(/research_brief/i).first()).toBeVisible();
  await expect(page.getByText(/pr_review/i).first()).toBeVisible();
});

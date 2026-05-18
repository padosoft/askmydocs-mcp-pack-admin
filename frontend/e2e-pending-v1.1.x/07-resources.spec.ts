import { test, expect } from '@playwright/test';
import { dismissTour } from './global-setup';
test.beforeEach(async ({ page }) => { await dismissTour(page); });

test('resources browser renders the tree + preview pane', async ({ page }) => {
  await page.goto('/resources');

  // The OpenAI MCP seed has docs/ + schemas/ + config.json
  await expect(page.getByText('docs/').first()).toBeVisible();
  await expect(page.getByText('schemas/').first()).toBeVisible();
});

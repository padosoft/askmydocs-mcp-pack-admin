import { test, expect } from '@playwright/test';
import { dismissTour } from './global-setup';
test.beforeEach(async ({ page }) => { await dismissTour(page); });

test('new-server wizard renders all 3 steps and validates identity', async ({ page }) => {
  await page.goto('/servers/new');

  await expect(page.getByRole('heading', { name: /Register MCP server/i })).toBeVisible();

  // Three wizard step dots (Identity / Transport / Policies) as <small> labels.
  await expect(page.locator('.wizard-step-dot').filter({ hasText: 'Identity' })).toBeVisible();
  await expect(page.locator('.wizard-step-dot').filter({ hasText: 'Transport' })).toBeVisible();
  await expect(page.locator('.wizard-step-dot').filter({ hasText: 'Policies' })).toBeVisible();

  // Submit without name → validation error fires. The primary "Next" button is
  // the one inside the wizard card footer, not the tiny one inside any tour
  // dialog — disambiguate by selecting the largest button (`.btn.primary` not
  // `.btn.primary.sm`).
  await page.locator('button.btn.primary').filter({ hasText: /Next/i }).first().click();
  await expect(page.getByText(/Name is required/i)).toBeVisible();
});

import { test, expect } from '@playwright/test';
import { dismissTour } from './global-setup';
test.beforeEach(async ({ page }) => { await dismissTour(page); });

test('settings page renders preferences, tenants and API keys sections', async ({ page }) => {
  await page.goto('/settings');

  await expect(page.getByText(/Preferences/i).first()).toBeVisible();
  await expect(page.getByText(/Tenants/i).first()).toBeVisible();
  await expect(page.getByText(/API keys/i).first()).toBeVisible();
});

test('help page renders shortcut reference', async ({ page }) => {
  await page.goto('/help');

  await expect(page.getByText(/Keyboard shortcuts/i).first()).toBeVisible();
});

test('command palette opens via Cmd+K and offers theme toggle', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Dashboard').first()).toBeVisible();

  // Dispatch the keydown directly on `window` to avoid focus race conditions
  // — the production handler also binds to `window.addEventListener('keydown')`.
  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
  });

  // The palette renders an input placeholder + an action labelled "Toggle theme".
  await expect(page.locator('.palette-input')).toBeVisible();
  await expect(page.locator('.palette').getByText(/Toggle theme/i).first()).toBeVisible();
});

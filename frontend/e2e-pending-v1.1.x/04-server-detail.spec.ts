import { test, expect } from '@playwright/test';
import { dismissTour } from './global-setup';
test.beforeEach(async ({ page }) => { await dismissTour(page); });

test('server detail renders identity, tabs and KPIs', async ({ page }) => {
  await page.goto('/server/srv_01');

  await expect(page.getByRole('heading', { name: 'openai-mcp' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Run handshake/i })).toBeVisible();
  await expect(page.getByText('Overview', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('Configuration')).toBeVisible();
});

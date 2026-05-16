import { test, expect } from '@playwright/test';
import { dismissTour } from './global-setup';
test.beforeEach(async ({ page }) => { await dismissTour(page); });

test('dashboard renders KPI strip + live feed + per-server health', async ({ page }) => {
  await page.goto('/');

  // Sidebar is the load-bearing landmark — assert all primary nav rails.
  await expect(page.getByText('Dashboard').first()).toBeVisible();
  await expect(page.getByText('Servers').first()).toBeVisible();
  await expect(page.getByText('Tools').first()).toBeVisible();
  await expect(page.getByText('Audit log').first()).toBeVisible();
  await expect(page.getByText('Circuit breakers').first()).toBeVisible();

  // KPI strip
  await expect(page.getByText('Active servers')).toBeVisible();
  await expect(page.getByText('Calls / minute')).toBeVisible();
  await expect(page.getByText(/p50 latency/i)).toBeVisible();

  // Live feed card
  await expect(page.getByText('Live tool-invocation feed')).toBeVisible();
});

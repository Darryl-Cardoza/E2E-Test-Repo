import { expect, test } from '@playwright/test';
import { appConfig } from '../fixtures/config';

test('E2E-006: an unauthenticated visitor cannot access the dashboard', async ({ page }) => {
  await page.goto(appConfig.dashboardPath);
  await expect(page).not.toHaveURL(new RegExp(appConfig.dashboardPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  await expect(page.getByLabel(/email/i)).toBeVisible();
});

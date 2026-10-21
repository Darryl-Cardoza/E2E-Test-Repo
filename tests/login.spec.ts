import { expect, test } from '@playwright/test';
import { appConfig, uniqueEmail } from '../fixtures/config';
import { LoginPage } from '../pages/LoginPage';

const password = 'Northstar-E2E!42';

test('E2E-004: a registered user can log in and reach the dashboard', async ({ page, request }) => {
  const email = uniqueEmail();
  const registration = await request.post(`${appConfig.apiUrl}/auth/register`, {
    data: { name: 'Northstar E2E', email, password },
  });
  expect(registration.ok(), `Registration failed with ${registration.status()}`).toBeTruthy();

  const login = new LoginPage(page);
  await login.open(appConfig.loginPath);
  await login.login(email, password);
  await expect(page).toHaveURL(new RegExp(`${appConfig.dashboardPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[/?#])`));
  await expect(page.getByText(/northstar e2e/i).first()).toBeVisible();
});

test('E2E-005: an incorrect password is rejected', async ({ page, request }) => {
  const email = uniqueEmail();
  const registration = await request.post(`${appConfig.apiUrl}/auth/register`, {
    data: { name: 'Northstar E2E', email, password },
  });
  expect(registration.ok(), `Registration failed with ${registration.status()}`).toBeTruthy();

  const login = new LoginPage(page);
  await login.open(appConfig.loginPath);
  await login.login(email, 'Incorrect-password!42');
  await expect(page.getByText(/invalid|incorrect|failed|credentials|password/i).first()).toBeVisible();
});

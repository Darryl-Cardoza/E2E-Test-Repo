import { expect, test } from '@playwright/test';
import { appConfig, uniqueEmail } from '../fixtures/config';
import { RegisterPage } from '../pages/RegisterPage';

const password = 'Northstar-E2E!42';

test('E2E-001: a visitor can register a new account', async ({ page }) => {
  const register = new RegisterPage(page);
  const email = uniqueEmail();
  await register.open(appConfig.registerPath);
  await register.expectFormVisible();
  await register.register('Northstar E2E', email, password);

  await expect(page.getByText(/success|created|welcome|registered/i).first()).toBeVisible();
});

test('E2E-002: registering an existing email is rejected', async ({ page, request }) => {
  const email = uniqueEmail();
  const created = await request.post(`${appConfig.apiUrl}/auth/register`, {
    data: { name: 'Northstar E2E', email, password },
  });
  expect(created.ok(), `Seed registration failed with ${created.status()}`).toBeTruthy();

  const register = new RegisterPage(page);
  await register.open(appConfig.registerPath);
  await register.register('Northstar E2E', email, password);
  await expect(page.getByText(/already|exists|duplicate|taken|registered/i).first()).toBeVisible();
});

test('E2E-003: invalid registration details are rejected by the form', async ({ page }) => {
  const register = new RegisterPage(page);
  await register.open(appConfig.registerPath);
  await register.email.fill('not-an-email');
  await register.password.fill('x');
  await register.submit.click();

  const emailInvalid = await register.email.evaluate((el: HTMLInputElement) => !el.validity.valid);
  const passwordInvalid = await register.password.evaluate((el: HTMLInputElement) => !el.validity.valid);
  const messageVisible = await page.getByRole('alert').isVisible().catch(() => false);
  expect(emailInvalid || passwordInvalid || messageVisible).toBeTruthy();
});

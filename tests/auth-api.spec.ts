import { expect, test } from '@playwright/test';
import { appConfig, uniqueEmail } from '../fixtures/config';

const apiUrl = appConfig.apiUrl;
const testPassword = 'Northstar-E2E!42';

test('E2E-010: API health endpoint succeeds', async ({ request }) => {
  const response = await request.get(`${apiUrl}/health`);
  expect(response.ok(), `Expected healthy API, received ${response.status()}`).toBeTruthy();
});

test('E2E-008: /auth/me rejects requests without a token', async ({ request }) => {
  const response = await request.get(`${apiUrl}/auth/me`);
  expect(response.status()).toBe(401);
});

test('E2E-009: /auth/me returns the signed-in account', async ({ request }) => {
  const email = uniqueEmail();
  const registration = await request.post(`${apiUrl}/auth/register`, {
    data: { name: 'Northstar E2E', email, password: testPassword },
  });
  expect(registration.ok(), `Registration failed with ${registration.status()}`).toBeTruthy();

  const login = await request.post(`${apiUrl}/auth/login`, { data: { email, password: testPassword } });
  expect(login.ok(), `Login failed with ${login.status()}`).toBeTruthy();
  const loginBody = await login.json() as Record<string, unknown>;
  const token = findString(loginBody, ['token', 'accessToken', 'access_token']);
  expect(token, 'Login response should contain a JWT token').toBeTruthy();

  const profile = await request.get(`${apiUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(profile.ok(), `Profile request failed with ${profile.status()}`).toBeTruthy();
  const profileBody = await profile.json() as Record<string, unknown>;
  expect(JSON.stringify(profileBody)).toContain(email);
});

function findString(value: unknown, keys: string[]): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const object = value as Record<string, unknown>;
  for (const key of keys) if (typeof object[key] === 'string') return object[key] as string;
  for (const nested of Object.values(object)) {
    const found = findString(nested, keys);
    if (found) return found;
  }
  return undefined;
}

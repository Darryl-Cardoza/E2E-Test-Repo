import { expect, type Locator, type Page } from '@playwright/test';

export class RegisterPage {
  readonly name: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;

  constructor(private readonly page: Page) {
    this.name = page.getByLabel(/name|full name/i);
    this.email = page.getByLabel(/email/i);
    this.password = page.getByLabel(/password/i);
    this.submit = page.getByRole('button', { name: /register|sign up|create account/i });
  }

  async open(path: string): Promise<void> {
    await this.page.goto(path);
  }

  async register(name: string, email: string, password: string): Promise<void> {
    await this.name.fill(name);
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }

  async expectFormVisible(): Promise<void> {
    await expect(this.email).toBeVisible();
    await expect(this.password).toBeVisible();
    await expect(this.submit).toBeVisible();
  }
}

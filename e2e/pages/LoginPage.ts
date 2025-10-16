import { type Page, type Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly signUpLink: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId("login-email-input");
    this.passwordInput = page.getByTestId("login-password-input");
    this.signInButton = page.getByTestId("login-submit-button");
    this.signUpLink = page.getByRole("link", { name: /zarejestruj/i });
    this.forgotPasswordLink = page.getByRole("link", { name: /zapomniał/i });
    this.errorMessage = page.locator('[data-testid="error-message"]');
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async goToSignUp() {
    await this.signUpLink.click();
  }

  async goToForgotPassword() {
    await this.forgotPasswordLink.click();
  }
}

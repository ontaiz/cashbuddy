import { Page, Locator } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly signInButton: Locator
  readonly signUpLink: Locator
  readonly forgotPasswordLink: Locator
  readonly errorMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.getByLabel(/email/i)
    this.passwordInput = page.getByLabel(/password/i)
    this.signInButton = page.getByRole('button', { name: /sign in/i })
    this.signUpLink = page.getByRole('link', { name: /sign up/i })
    this.forgotPasswordLink = page.getByRole('link', { name: /forgot password/i })
    this.errorMessage = page.locator('[data-testid="error-message"]')
  }

  async goto() {
    await this.page.goto('/login')
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.signInButton.click()
  }

  async goToSignUp() {
    await this.signUpLink.click()
  }

  async goToForgotPassword() {
    await this.forgotPasswordLink.click()
  }
}

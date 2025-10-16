import { type Page, type Locator, expect } from '@playwright/test'
import { BasePage } from './BasePage'

/**
 * Page Object Model for Login Page
 * Handles authentication flow
 */
export class LoginPage extends BasePage {
  // Form elements
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly signInButton: Locator
  readonly signUpLink: Locator
  readonly forgotPasswordLink: Locator
  readonly errorMessage: Locator

  constructor(page: Page) {
    super(page)
    
    this.emailInput = this.getByTestId('login-email-input')
    this.passwordInput = this.getByTestId('login-password-input')
    this.signInButton = this.getByTestId('login-submit-button')
    this.signUpLink = page.getByRole('link', { name: /zarejestruj/i })
    this.forgotPasswordLink = page.getByRole('link', { name: /zapomniał/i })
    // Error message appears as a toast notification (sonner)
    this.errorMessage = page.locator('[data-sonner-toast]').filter({ hasText: /invalid|błąd|nieprawidłow/i })
  }

  /**
   * Navigate to login page
   */
  async goto(): Promise<void> {
    await super.goto('/login')
    await this.waitForPageLoad()
  }

  /**
   * Login with credentials
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillInput(this.emailInput, email)
    await this.fillInput(this.passwordInput, password)
    
    // Wait for React to update state and enable the button
    await expect(this.signInButton).toBeEnabled({ timeout: 5000 })
    
    // Setup promise to wait for API response before clicking
    const responsePromise = this.page.waitForResponse(
      response => {
        const isLoginApi = response.url().includes('/api/auth/login')
        const isPost = response.request().method() === 'POST'
        return isLoginApi && isPost
      },
      { timeout: 15000 }
    )
    
    // Click submit button
    await this.clickElement(this.signInButton)
    
    // Wait for the API response to complete
    await responsePromise
    
    // Wait for React to process the response and update UI
    // Increased timeout to ensure state updates are reflected
    await this.page.waitForTimeout(1000)
  }

  /**
   * Login with environment credentials
   */
  async loginWithTestCredentials(): Promise<void> {
    const email = process.env.E2E_USERNAME
    const password = process.env.E2E_PASSWORD
    
    if (!email || !password) {
      throw new Error('E2E_USERNAME and E2E_PASSWORD must be set in .env.test')
    }
    
    await this.login(email, password)
  }

  /**
   * Wait for successful login (redirect to dashboard)
   */
  async waitForLoginSuccess(): Promise<void> {
    // Wait for redirect to dashboard or expenses page
    await this.page.waitForURL(/\/(dashboard|expenses)/)
  }

  /**
   * Complete login flow with test credentials
   */
  async performLogin(): Promise<void> {
    await this.goto()
    await this.loginWithTestCredentials()
    await this.waitForLoginSuccess()
  }

  /**
   * Check if error message is visible
   */
  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible()
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    if (await this.hasError()) {
      return await this.errorMessage.textContent() || ''
    }
    return ''
  }

  /**
   * Navigate to sign up page
   */
  async goToSignUp(): Promise<void> {
    await this.clickElement(this.signUpLink)
  }

  /**
   * Navigate to forgot password page
   */
  async goToForgotPassword(): Promise<void> {
    await this.clickElement(this.forgotPasswordLink)
  }
}

import { expect } from '@playwright/test'
import type { Page, Locator } from '@playwright/test'

/**
 * Base Page Object Model class providing common functionality
 * for all page objects in the application
 */
export abstract class BasePage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Navigate to a specific URL
   */
  async goto(url: string): Promise<void> {
    await this.page.goto(url)
  }

  /**
   * Wait for page to be loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle')
    // Additional wait to ensure page is fully interactive
    await this.page.waitForLoadState('domcontentloaded')
  }

  /**
   * Get element by test ID
   */
  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId)
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(locator: Locator, timeout: number = 10000): Promise<void> {
    await expect(locator).toBeVisible({ timeout })
  }

  /**
   * Wait for element to be hidden
   */
  async waitForElementToHide(locator: Locator, timeout: number = 10000): Promise<void> {
    await expect(locator).toBeHidden({ timeout })
  }

  /**
   * Fill input field with validation
   */
  async fillInput(locator: Locator, value: string): Promise<void> {
    await expect(locator).toBeVisible()
    await expect(locator).toBeEnabled()
    
    // Clear the field first, then fill
    await locator.clear()
    await locator.fill(value)
    
    // Verify the value was set correctly
    await expect(locator).toHaveValue(value)
  }

  /**
   * Click element with validation
   */
  async clickElement(locator: Locator, timeout: number = 10000): Promise<void> {
    await expect(locator).toBeVisible({ timeout })
    await expect(locator).toBeEnabled({ timeout })
    await locator.click({ timeout })
  }

  /**
   * Take screenshot for visual comparison
   */
  async takeScreenshot(name: string): Promise<void> {
    await expect(this.page).toHaveScreenshot(`${name}.png`)
  }

  /**
   * Check if page is still active (not closed)
   */
  async isPageActive(): Promise<boolean> {
    try {
      return !this.page.isClosed()
    } catch {
      return false
    }
  }

  /**
   * Safe wait with page state check
   */
  async safeWait(ms: number): Promise<void> {
    if (await this.isPageActive()) {
      await this.page.waitForTimeout(ms)
    }
  }

  /**
   * Safe element interaction with page state check
   */
  async safeExpect(assertion: () => Promise<void>): Promise<void> {
    if (await this.isPageActive()) {
      await assertion()
    } else {
      throw new Error('Page has been closed or is no longer active')
    }
  }
}

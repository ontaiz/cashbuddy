import { expect } from '@playwright/test'
import type { Page, Locator } from '@playwright/test'
import { BasePage } from './BasePage'

export interface ExpenseFormData {
  name: string
  amount: string
  date: string
  description?: string
}

/**
 * Page Object Model for Expense Form Modal component
 * Handles all interactions with the expense creation/editing form
 */
export class ExpenseFormModal extends BasePage {
  // Modal container
  readonly modal: Locator
  
  // Form inputs
  readonly nameInput: Locator
  readonly amountInput: Locator
  readonly datePickerButton: Locator
  readonly descriptionInput: Locator
  
  // Form buttons
  readonly saveButton: Locator
  readonly cancelButton: Locator
  
  // Calendar component (when date picker is open)
  readonly calendar: Locator

  constructor(page: Page) {
    super(page)
    
    // Initialize locators using data-testid attributes
    this.modal = this.getByTestId('expense-form-modal')
    this.nameInput = this.getByTestId('expense-name-input')
    this.amountInput = this.getByTestId('expense-amount-input')
    this.datePickerButton = this.getByTestId('expense-date-picker')
    this.descriptionInput = this.getByTestId('expense-description-input')
    this.saveButton = this.getByTestId('expense-form-save-button')
    this.cancelButton = this.getByTestId('expense-form-cancel-button')
    // Use more reliable calendar selector
    this.calendar = this.page.locator('.rdp').or(this.page.locator('[role="dialog"] .rdp')).or(this.page.locator('[data-testid="calendar"]'))
  }

  /**
   * Wait for modal to be visible
   */
  async waitForModalToOpen(): Promise<void> {
    // Check if page is still active
    if (!(await this.isPageActive())) {
      throw new Error('Page has been closed or is no longer active')
    }

    // Try multiple strategies to find the modal
    try {
      await this.safeExpect(() => expect(this.modal).toBeVisible({ timeout: 10000 }))
    } catch (error) {
      // Fallback: try to find modal by role
      const dialogModal = this.page.getByRole('dialog', { name: /dodaj wydatek|edytuj wydatek/i })
      await this.safeExpect(() => expect(dialogModal).toBeVisible({ timeout: 5000 }))
    }
    
    // Wait for form inputs to be ready
    await this.safeExpect(() => expect(this.nameInput).toBeVisible({ timeout: 5000 }))
    await this.safeExpect(() => expect(this.amountInput).toBeVisible({ timeout: 5000 }))
    await this.safeExpect(() => expect(this.datePickerButton).toBeVisible({ timeout: 5000 }))
    await this.safeExpect(() => expect(this.descriptionInput).toBeVisible({ timeout: 5000 }))
    await this.safeExpect(() => expect(this.saveButton).toBeVisible({ timeout: 5000 }))
    
    // Small delay to ensure form is fully initialized
    await this.safeWait(200)
  }

  /**
   * Wait for modal to be hidden
   */
  async waitForModalToClose(): Promise<void> {
    if (await this.isPageActive()) {
      await this.waitForElementToHide(this.modal, 10000)
    }
  }

  /**
   * Check if modal is in edit mode (has existing data)
   */
  async isEditMode(): Promise<boolean> {
    const title = this.modal.getByRole('heading', { level: 2 })
    const titleText = await title.textContent()
    return titleText?.includes('Edytuj') ?? false
  }

  /**
   * Fill expense name field
   */
  async fillName(name: string): Promise<void> {
    if (!(await this.isPageActive())) {
      throw new Error('Page has been closed or is no longer active')
    }
    await this.fillInput(this.nameInput, name)
  }

  /**
   * Fill expense amount field
   */
  async fillAmount(amount: string): Promise<void> {
    if (!(await this.isPageActive())) {
      throw new Error('Page has been closed or is no longer active')
    }
    await this.fillInput(this.amountInput, amount)
  }

  /**
   * Fill expense description field
   */
  async fillDescription(description: string): Promise<void> {
    if (!(await this.isPageActive())) {
      throw new Error('Page has been closed or is no longer active')
    }
    await this.fillInput(this.descriptionInput, description)
  }

  /**
   * Select date using date picker
   * @param date - Date in format YYYY-MM-DD or Date object
   */
  async selectDate(date: string | Date): Promise<void> {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0]
    const [year, month, day] = dateStr.split('-').map(Number)
    
    // Open date picker by clicking the button
    await this.clickElement(this.datePickerButton)
    
    // Wait for calendar to appear
    const calendar = this.page.locator('[data-slot="calendar"]')
    await expect(calendar).toBeVisible({ timeout: 5000 })
    
    // Create target date for data-day attribute
    const targetDate = new Date(year, month - 1, day)
    const dateString = targetDate.toLocaleDateString()
    
    // Try to find the day button using data-day attribute
    let dayButton = this.page.locator(`button[data-day="${dateString}"]`)
    
    // If not found, try alternative formats
    if (!(await dayButton.isVisible())) {
      // Try different date formats
      const alternativeFormats = [
        `${month}/${day}/${year}`,
        `${day}/${month}/${year}`,
        `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
        targetDate.toLocaleDateString('en-US'),
        targetDate.toLocaleDateString('pl-PL')
      ]
      
      for (const format of alternativeFormats) {
        dayButton = this.page.locator(`button[data-day="${format}"]`)
        if (await dayButton.isVisible()) {
          break
        }
      }
    }
    
    // If still not found, try by text content
    if (!(await dayButton.isVisible())) {
      dayButton = calendar.getByRole('button', { name: day.toString(), exact: true })
    }
    
    // Final fallback - any button with the day number
    if (!(await dayButton.isVisible())) {
      dayButton = calendar.getByRole('button').filter({ hasText: new RegExp(`^${day}$`) })
    }
    
    if (await dayButton.isVisible()) {
      await dayButton.click()
    } else {
      throw new Error(`Could not find day button for day ${day}. Available buttons: ${await this.page.locator('[data-slot="calendar"] button').allTextContents()}`)
    }
    
    // Wait for calendar to close
    await expect(calendar).toBeHidden({ timeout: 5000 }).catch(() => {
      // Calendar might close immediately, ignore timeout
    })
  }

  /**
   * Fill complete expense form
   */
  async fillExpenseForm(expense: ExpenseFormData): Promise<void> {
    await this.fillName(expense.name)
    await this.fillAmount(expense.amount)
    await this.selectDate(expense.date)
    
    if (expense.description) {
      await this.fillDescription(expense.description)
    }
  }

  /**
   * Save the expense form
   */
  async saveExpense(): Promise<void> {
    if (!(await this.isPageActive())) {
      throw new Error('Page has been closed or is no longer active')
    }
    await this.clickElement(this.saveButton, 10000)
    // Wait a bit for the save operation to start
    await this.safeWait(500)
    await this.waitForModalToClose()
  }

  /**
   * Cancel the expense form
   */
  async cancelExpense(): Promise<void> {
    if (!(await this.isPageActive())) {
      throw new Error('Page has been closed or is no longer active')
    }
    await this.clickElement(this.cancelButton, 10000)
    await this.waitForModalToClose()
  }

  /**
   * Create new expense (complete flow)
   */
  async createExpense(expense: ExpenseFormData): Promise<void> {
    await this.waitForModalToOpen()
    await this.fillExpenseForm(expense)
    await this.saveExpense()
  }

  /**
   * Edit existing expense (complete flow)
   */
  async editExpense(updates: Partial<ExpenseFormData>): Promise<void> {
    await this.waitForModalToOpen()
    
    if (updates.name) await this.fillName(updates.name)
    if (updates.amount) await this.fillAmount(updates.amount)
    if (updates.date) await this.selectDate(updates.date)
    if (updates.description !== undefined) await this.fillDescription(updates.description)
    
    await this.saveExpense()
  }

  /**
   * Get form validation errors
   */
  async getValidationErrors(): Promise<string[]> {
    const errorElements = this.modal.locator('.text-destructive')
    const errors: string[] = []
    
    const count = await errorElements.count()
    for (let i = 0; i < count; i++) {
      const errorText = await errorElements.nth(i).textContent()
      if (errorText) errors.push(errorText.trim())
    }
    
    return errors
  }

  /**
   * Check if save button is enabled
   */
  async isSaveButtonEnabled(): Promise<boolean> {
    return await this.saveButton.isEnabled()
  }

  /**
   * Verify form is in loading state
   */
  async verifyLoadingState(): Promise<void> {
    await expect(this.saveButton).toContainText('Zapisywanie...')
    await expect(this.saveButton).toBeDisabled()
  }
}

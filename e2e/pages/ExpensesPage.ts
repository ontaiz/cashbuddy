import { Page, Locator } from '@playwright/test'

export class ExpensesPage {
  readonly page: Page
  readonly addExpenseButton: Locator
  readonly searchInput: Locator
  readonly categoryFilter: Locator
  readonly expensesList: Locator
  readonly modal: Locator
  readonly modalAmountInput: Locator
  readonly modalDescriptionInput: Locator
  readonly modalCategorySelect: Locator
  readonly modalDateInput: Locator
  readonly modalSaveButton: Locator
  readonly modalCancelButton: Locator
  readonly nextPageButton: Locator
  readonly prevPageButton: Locator

  constructor(page: Page) {
    this.page = page
    this.addExpenseButton = page.getByRole('button', { name: /add expense/i })
    this.searchInput = page.getByPlaceholder(/search expenses/i)
    this.categoryFilter = page.getByLabel(/filter by category/i)
    this.expensesList = page.locator('[data-testid="expenses-list"]')
    this.modal = page.getByRole('dialog')
    this.modalAmountInput = page.getByLabel(/amount/i)
    this.modalDescriptionInput = page.getByLabel(/description/i)
    this.modalCategorySelect = page.getByLabel(/category/i)
    this.modalDateInput = page.getByLabel(/date/i)
    this.modalSaveButton = page.getByRole('button', { name: /save/i })
    this.modalCancelButton = page.getByRole('button', { name: /cancel/i })
    this.nextPageButton = page.getByRole('button', { name: /next/i })
    this.prevPageButton = page.getByRole('button', { name: /previous/i })
  }

  async goto() {
    await this.page.goto('/expenses')
  }

  async openAddExpenseModal() {
    await this.addExpenseButton.click()
  }

  async addExpense(expense: {
    amount: string
    description: string
    category: string
    date: string
  }) {
    await this.openAddExpenseModal()
    await this.modalAmountInput.fill(expense.amount)
    await this.modalDescriptionInput.fill(expense.description)
    await this.modalCategorySelect.selectOption(expense.category)
    await this.modalDateInput.fill(expense.date)
    await this.modalSaveButton.click()
  }

  async searchExpenses(query: string) {
    await this.searchInput.fill(query)
  }

  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category)
  }

  async editExpense(index: number, updates: Partial<{
    amount: string
    description: string
    category: string
    date: string
  }>) {
    await this.page.getByRole('button', { name: /edit/i }).nth(index).click()
    
    if (updates.amount) {
      await this.modalAmountInput.fill(updates.amount)
    }
    if (updates.description) {
      await this.modalDescriptionInput.fill(updates.description)
    }
    if (updates.category) {
      await this.modalCategorySelect.selectOption(updates.category)
    }
    if (updates.date) {
      await this.modalDateInput.fill(updates.date)
    }
    
    await this.modalSaveButton.click()
  }

  async deleteExpense(index: number) {
    await this.page.getByRole('button', { name: /delete/i }).nth(index).click()
    // Confirm deletion in confirmation dialog
    await this.page.getByRole('button', { name: /delete/i }).click()
  }

  async goToNextPage() {
    await this.nextPageButton.click()
  }

  async goToPreviousPage() {
    await this.prevPageButton.click()
  }
}

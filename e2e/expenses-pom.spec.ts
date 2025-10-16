import { test, expect } from '@playwright/test'
import { ExpensesPage, type ExpenseFormData, LoginPage } from './page-objects'

test.describe('Expenses Page - POM Implementation', () => {
  let expensesPage: ExpensesPage
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    // Set longer timeout for setup
    test.setTimeout(60000)
    
    try {
      // First login with test credentials
      loginPage = new LoginPage(page)
      await loginPage.performLogin()
      
      // Then navigate to expenses page
      expensesPage = new ExpensesPage(page)
      await expensesPage.goto()
      
      // Verify page is ready
      await expensesPage.verifyPageLoaded()
    } catch (error) {
      console.error('Setup failed:', error)
      throw error
    }
  })

  test.afterEach(async ({ page }) => {
    // Ensure page cleanup
    if (!page.isClosed()) {
      await page.close()
    }
  })

  test('should add new expense successfully', async () => {
    // Arrange
    const newExpense: ExpenseFormData = {
      name: 'Zakupy spożywcze',
      amount: '150.50',
      date: '2024-01-15',
      description: 'Zakupy w Biedronce'
    }

    // Act
    await expensesPage.addExpense(newExpense)

    // Assert
    await expect(expensesPage.page.getByText('Wydatek został dodany')).toBeVisible()
    
    // Verify expense appears in the table
    const expenseCount = await expensesPage.getExpenseCount()
    expect(expenseCount).toBeGreaterThan(0)
  })

  test('should handle empty state correctly', async () => {
    // Arrange - assume empty state
    
    // Act & Assert
    if (await expensesPage.isExpenseListEmpty()) {
      await expensesPage.verifyEmptyState()
      
      // Test adding first expense
      const firstExpense: ExpenseFormData = {
        name: 'Pierwszy wydatek',
        amount: '100.00',
        date: '2024-01-01'
      }
      
      await expensesPage.addExpense(firstExpense)
      await expect(expensesPage.page.getByText('Wydatek został dodany')).toBeVisible()
    }
  })

  test('should edit expense successfully', async () => {
    // Set longer timeout for this complex test
    test.setTimeout(90000)
    
    try {
      // Arrange - ensure we have at least one expense
      const initialExpense: ExpenseFormData = {
        name: 'Wydatek do edycji',
        amount: '75.00',
        date: '2024-01-10'
      }
      
      await expensesPage.addExpense(initialExpense)
      
      // Wait for expense to be added and page to stabilize
      await expensesPage.waitForExpensesToLoad()
      
      // Get the expense ID (in real scenario, this would come from API response)
      const expenseIds = await expensesPage.expensesTable.getAllExpenseIds()
      if (expenseIds.length === 0) {
        throw new Error('No expenses found after adding one')
      }
      const expenseId = expenseIds[0]

      // Act
      const updates: Partial<ExpenseFormData> = {
        name: 'Zaktualizowany wydatek',
        amount: '125.00'
      }
      
      await expensesPage.editExpense(expenseId, updates)

      // Assert
      await expect(expensesPage.page.getByText('Wydatek został zaktualizowany')).toBeVisible({ timeout: 10000 })
      await expensesPage.expensesTable.verifyExpenseData(expenseId, {
        name: updates.name,
        amount: updates.amount
      })
    } catch (error) {
      console.error('Edit expense test failed:', error)
      throw error
    }
  })

  test('should delete expense successfully', async () => {
    // Arrange - ensure we have at least one expense
    const expenseToDelete: ExpenseFormData = {
      name: 'Wydatek do usunięcia',
      amount: '50.00',
      date: '2024-01-05'
    }
    
    await expensesPage.addExpense(expenseToDelete)
    
    const expenseIds = await expensesPage.expensesTable.getAllExpenseIds()
    const expenseId = expenseIds[0]

    // Act
    await expensesPage.deleteExpense(expenseId)

    // Assert
    await expect(expensesPage.page.getByText('Wydatek został usunięty')).toBeVisible()
    await expensesPage.verifyExpenseDeleted(expenseId)
  })

})

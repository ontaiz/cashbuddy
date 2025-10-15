import { test, expect } from '@playwright/test'

test.describe('Expenses Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication - in a real app you'd need to handle login
    await page.goto('/expenses')
  })

  test('should display expenses page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /expenses/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /add expense/i })).toBeVisible()
  })

  test('should open add expense modal', async ({ page }) => {
    await page.getByRole('button', { name: /add expense/i }).click()
    
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: /add expense/i })).toBeVisible()
    await expect(page.getByLabel(/amount/i)).toBeVisible()
    await expect(page.getByLabel(/description/i)).toBeVisible()
    await expect(page.getByLabel(/category/i)).toBeVisible()
    await expect(page.getByLabel(/date/i)).toBeVisible()
  })

  test('should add new expense', async ({ page }) => {
    await page.getByRole('button', { name: /add expense/i }).click()
    
    // Fill the form
    await page.getByLabel(/amount/i).fill('25.50')
    await page.getByLabel(/description/i).fill('Coffee and pastry')
    await page.getByLabel(/category/i).selectOption('Food')
    await page.getByLabel(/date/i).fill('2023-10-15')
    
    // Submit the form
    await page.getByRole('button', { name: /save/i }).click()
    
    // Check if expense was added to the list
    await expect(page.getByText('Coffee and pastry')).toBeVisible()
    await expect(page.getByText('$25.50')).toBeVisible()
  })

  test('should filter expenses by category', async ({ page }) => {
    // Assuming there are expenses in the list
    await page.getByLabel(/filter by category/i).selectOption('Food')
    
    // Check that only food expenses are visible
    await expect(page.getByText(/food/i)).toBeVisible()
  })

  test('should search expenses', async ({ page }) => {
    await page.getByPlaceholder(/search expenses/i).fill('coffee')
    
    // Check that search results are filtered
    await expect(page.getByText(/coffee/i)).toBeVisible()
  })

  test('should edit expense', async ({ page }) => {
    // Click edit button on first expense (assuming there are expenses)
    await page.getByRole('button', { name: /edit/i }).first().click()
    
    // Check if edit modal opens
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: /edit expense/i })).toBeVisible()
    
    // Update the description
    await page.getByLabel(/description/i).fill('Updated expense description')
    await page.getByRole('button', { name: /save/i }).click()
    
    // Check if the expense was updated
    await expect(page.getByText('Updated expense description')).toBeVisible()
  })

  test('should delete expense', async ({ page }) => {
    // Click delete button on first expense
    await page.getByRole('button', { name: /delete/i }).first().click()
    
    // Confirm deletion in the confirmation dialog
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText(/are you sure/i)).toBeVisible()
    await page.getByRole('button', { name: /delete/i }).click()
    
    // Check if expense was removed (this would depend on the specific expense)
    // await expect(page.getByText('Specific expense text')).not.toBeVisible()
  })

  test('should paginate expenses', async ({ page }) => {
    // Check if pagination controls are visible (assuming there are enough expenses)
    await expect(page.getByRole('button', { name: /next/i })).toBeVisible()
    
    // Click next page
    await page.getByRole('button', { name: /next/i }).click()
    
    // Check if we're on page 2
    await expect(page.getByText(/page 2/i)).toBeVisible()
  })
})

test.describe('Expenses Visual Tests', () => {
  test('expenses page screenshot', async ({ page }) => {
    await page.goto('/expenses')
    
    // Wait for content to load
    await page.waitForLoadState('networkidle')
    
    // Take screenshot for visual comparison
    await expect(page).toHaveScreenshot('expenses-page.png')
  })
})

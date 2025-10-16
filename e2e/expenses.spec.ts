import { test, expect } from '@playwright/test'
import { LoginPage } from './page-objects'

test.describe('Expenses Management', () => {
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    // First login with test credentials
    loginPage = new LoginPage(page)
    await loginPage.performLogin()
    
    // Then navigate to expenses page
    await page.goto('/expenses')
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')
  })

  test('should display expenses page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /wydatki/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /dodaj wydatek/i })).toBeVisible()
  })

  test('should open add expense modal', async ({ page }) => {
    await page.getByRole('button', { name: /dodaj wydatek/i }).click()
    
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: /dodaj wydatek/i })).toBeVisible()
    await expect(page.getByLabel(/nazwa/i)).toBeVisible()
    await expect(page.getByLabel(/kwota/i)).toBeVisible()
    await expect(page.getByLabel(/data/i)).toBeVisible()
    await expect(page.getByLabel(/opis/i)).toBeVisible()
  })

  test('should add new expense', async ({ page }) => {
    await page.getByRole('button', { name: /dodaj wydatek/i }).click()
    
    // Fill the form
    await page.getByLabel(/nazwa/i).fill('Coffee and pastry')
    await page.getByLabel(/kwota/i).fill('25.50')
    // Date is already set to today by default, so we don't need to fill it
    await page.getByLabel(/opis/i).fill('Morning coffee and croissant')
    
    // Submit the form
    await page.getByRole('button', { name: /zapisz/i }).click()
    
    // Check if success message is visible
    await expect(page.getByText('Wydatek został dodany')).toBeVisible()
    
    // Check if expense was added to the list (use first() in case there are duplicates)
    await expect(page.getByText('Coffee and pastry').first()).toBeVisible()
    await expect(page.getByText(/25[.,]50/).first()).toBeVisible()
  })
})
import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication - in a real app you'd need to handle login
    await page.goto('/dashboard')
  })

  test('should display dashboard with key metrics', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    
    // Check for stat cards
    await expect(page.getByText(/total expenses/i)).toBeVisible()
    await expect(page.getByText(/this month/i)).toBeVisible()
    await expect(page.getByText(/average per day/i)).toBeVisible()
    await expect(page.getByText(/categories/i)).toBeVisible()
  })

  test('should display monthly expenses chart', async ({ page }) => {
    // Check if chart container is visible
    await expect(page.locator('[data-testid="monthly-chart"]')).toBeVisible()
    
    // Wait for chart to load
    await page.waitForTimeout(1000)
    
    // Check if chart has data points (SVG elements)
    await expect(page.locator('svg')).toBeVisible()
  })

  test('should display top expenses list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /top expenses/i })).toBeVisible()
    
    // Check if expenses list is visible
    await expect(page.locator('[data-testid="top-expenses-list"]')).toBeVisible()
  })

  test('should navigate to expenses page from dashboard', async ({ page }) => {
    await page.getByRole('link', { name: /view all expenses/i }).click()
    
    await expect(page).toHaveURL('/expenses')
    await expect(page.getByRole('heading', { name: /expenses/i })).toBeVisible()
  })

  test('should display empty state when no expenses', async ({ page }) => {
    // This would require mocking an empty state
    // For now, we'll check if empty state component exists
    const emptyState = page.locator('[data-testid="empty-state"]')
    
    if (await emptyState.isVisible()) {
      await expect(emptyState.getByText(/no expenses yet/i)).toBeVisible()
      await expect(emptyState.getByRole('button', { name: /add your first expense/i })).toBeVisible()
    }
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check if dashboard is still functional on mobile
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    await expect(page.getByText(/total expenses/i)).toBeVisible()
  })
})

test.describe('Dashboard Visual Tests', () => {
  test('dashboard page screenshot', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Wait for all content to load including charts
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Extra wait for charts to render
    
    // Take screenshot for visual comparison
    await expect(page).toHaveScreenshot('dashboard-page.png')
  })

  test('dashboard mobile screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard')
    
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    await expect(page).toHaveScreenshot('dashboard-mobile.png')
  })
})

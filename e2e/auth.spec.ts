import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page before each test
    await page.goto('/login')
    // Wait for React hydration
    await page.waitForLoadState('networkidle')
  })

  test('should display login form', async ({ page }) => {
    // Wait for form to be hydrated by checking for test-specific element
    await page.waitForSelector('[data-testid="login-email-input"]', { state: 'visible', timeout: 10000 })
    
    // Check if login form elements are visible
    // Use data-slot selector for title since it's a UI component
    await expect(page.locator('[data-slot="card-title"]').filter({ hasText: 'Zaloguj się' })).toBeVisible()
    await expect(page.getByTestId('login-email-input')).toBeVisible()
    await expect(page.getByTestId('login-password-input')).toBeVisible()
    await expect(page.getByTestId('login-submit-button')).toBeVisible()
  })

  test('should disable submit button when form is empty', async ({ page }) => {
    // Check that submit button is disabled when form is empty
    await expect(page.getByTestId('login-submit-button')).toBeDisabled()
    
    // Fill one field - button should still be disabled
    await page.getByTestId('login-email-input').fill('test@example.com')
    await expect(page.getByTestId('login-submit-button')).toBeDisabled()
    
    // Fill both fields - button should be enabled
    await page.getByTestId('login-password-input').fill('password')
    await expect(page.getByTestId('login-submit-button')).toBeEnabled()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill form with invalid credentials
    await page.getByTestId('login-email-input').fill('invalid@example.com')
    await page.getByTestId('login-password-input').fill('wrongpassword')
    
    // Wait for button to be enabled
    await expect(page.getByTestId('login-submit-button')).toBeEnabled()
    
    // Setup promise to wait for API response
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    )
    
    await page.getByTestId('login-submit-button').click()
    await responsePromise
    
    // Check for error message (appears as toast notification or in error div)
    const toastError = page.locator('[data-sonner-toast]').filter({ hasText: /błąd|invalid/i })
    const inlineError = page.getByTestId('error-message')
    
    // Either toast or inline error should be visible
    await expect(toastError.or(inlineError)).toBeVisible()
  })

  test('should navigate to register page', async ({ page }) => {
    // Click on register link
    await page.getByRole('link', { name: /zarejestruj/i }).click()
    
    // Check if we're on the register page
    await expect(page).toHaveURL('/register')
    await expect(page.locator('[data-slot="card-title"]').filter({ hasText: 'Utwórz konto' })).toBeVisible()
  })

  test('should navigate to password reset page', async ({ page }) => {
    // Click on forgot password link
    await page.getByRole('link', { name: /zapomniał/i }).click()
    
    // Check if we're on the password reset page
    await expect(page).toHaveURL('/password-reset')
    await expect(page.locator('[data-slot="card-title"]').filter({ hasText: 'Resetuj hasło' })).toBeVisible()
  })
})

test.describe('Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
    // Wait for React hydration
    await page.waitForLoadState('networkidle')
  })

  test('should display registration form', async ({ page }) => {
    // Wait for form to be visible using accessible labels
    await page.waitForSelector('input[placeholder="twoj@email.pl"]', { state: 'visible', timeout: 10000 })
    
    // Check title
    await expect(page.locator('[data-slot="card-title"]').filter({ hasText: 'Utwórz konto' })).toBeVisible()
    
    // Check form fields using accessible names
    await expect(page.getByRole('textbox', { name: /adres e-mail/i })).toBeVisible()
    await expect(page.getByRole('textbox', { name: /^hasło/i })).toBeVisible()
    await expect(page.getByRole('textbox', { name: /potwierdź hasło/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /zarejestruj się/i })).toBeVisible()
  })

  test('should show validation errors for mismatched passwords', async ({ page }) => {
    // Fill form fields using labels
    await page.getByRole('textbox', { name: /adres e-mail/i }).fill('test@example.com')
    await page.getByRole('textbox', { name: /^hasło/i }).fill('Password123')
    await page.getByRole('textbox', { name: /potwierdź hasło/i }).fill('DifferentPassword123')
    
    // Wait for button to be enabled
    const submitButton = page.getByRole('button', { name: /zarejestruj się/i })
    await expect(submitButton).toBeEnabled()
    await submitButton.click()
    
    // Check for validation error
    await expect(page.getByText(/hasła nie są identyczne/i)).toBeVisible()
  })
})

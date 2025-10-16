# Testing Guide

This project uses a comprehensive testing setup with Vitest for unit tests and Playwright for end-to-end tests.

## Testing Stack

- **Vitest** - Fast unit test runner with TypeScript support
- **React Testing Library** - Testing utilities for React components
- **Playwright** - Reliable end-to-end testing
- **MSW (Mock Service Worker)** - API mocking for tests
- **Faker.js** - Generate realistic test data

## Running Tests

### Unit Tests

```bash
# Run tests in watch mode (development)
npm run test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode with specific filter
npm run test -- --watch -t "Button"
```

### E2E Tests

Before running E2E tests, create a `.env.test` file with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key

# Test User Credentials
E2E_USERNAME=test@example.com
E2E_PASSWORD=your-test-password
```

```bash
# Run all e2e tests
npm run test:e2e

# Run e2e tests with UI
npm run test:e2e:ui

# Run e2e tests in headed mode (see browser)
npm run test:e2e:headed

# Run e2e tests in debug mode
npm run test:e2e:debug

# Run specific test file
npx playwright test auth.spec.ts
```

**Database Cleanup**: After all tests complete, the global teardown script automatically deletes all expenses created by the test user, ensuring a clean state for the next test run.

## Test Structure

```
src/
├── test/
│   ├── setup.ts          # Vitest setup file
│   ├── utils.tsx         # Test utilities and custom render
│   └── mocks/
│       ├── server.ts     # MSW server setup
│       └── handlers.ts   # API mock handlers
├── components/
│   └── **/*.test.tsx     # Component tests
└── lib/
    └── **/*.test.ts      # Service/utility tests

e2e/
├── page-objects/         # Page Object Models
│   ├── LoginPage.ts
│   ├── ExpensesPage.ts
│   └── ExpensesTable.ts
├── global-teardown.ts    # Cleanup script (runs after all tests)
└── *.spec.ts            # E2E test files
```

## Writing Unit Tests

### Component Testing

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { Button } from './button'

describe('Button', () => {
  it('handles click events', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    
    await user.click(screen.getByRole('button'))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Service Testing with Mocks

```typescript
import { describe, it, expect, vi } from 'vitest'
import { createMockExpense } from '@/test/utils'

// Mock the Supabase client
vi.mock('@/db/supabase.client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}))

describe('ExpenseService', () => {
  it('should fetch expenses', async () => {
    const mockExpenses = [createMockExpense()]
    
    // Setup mock implementation
    const mockSupabase = await import('@/db/supabase.client')
    vi.mocked(mockSupabase.supabase.from().single).mockResolvedValue({
      data: mockExpenses,
      error: null,
    })

    const result = await expenseService.getExpenses()
    expect(result.data).toEqual(mockExpenses)
  })
})
```

## E2E Test Database Cleanup

The project includes an automatic database cleanup mechanism that runs after all E2E tests complete.

### How It Works

1. **Global Teardown**: After all Playwright tests finish, the `e2e/global-teardown.ts` script automatically executes
2. **Test User Authentication**: The script signs in as the test user (using `E2E_USERNAME` and `E2E_PASSWORD`)
3. **Data Deletion**: All expenses created by the test user are deleted from the Supabase database
4. **Clean State**: This ensures each test run starts with a clean slate

### Manual Cleanup

If you need to manually clean up test data:

```bash
# The teardown runs automatically after tests, but you can also run it manually
npx tsx e2e/global-teardown.ts
```

### Configuration

The teardown is configured in `playwright.config.ts`:

```typescript
export default defineConfig({
  globalTeardown: './e2e/global-teardown.ts',
  // ... other config
})
```

## Writing E2E Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/page-url')
  })

  test('should perform action', async ({ page }) => {
    await page.getByRole('button', { name: /click me/i }).click()
    await expect(page.getByText('Success')).toBeVisible()
  })
})
```

### Using Page Object Model

```typescript
import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'

test('should login successfully', async ({ page }) => {
  const loginPage = new LoginPage(page)
  await loginPage.goto()
  await loginPage.login('user@example.com', 'password')
  
  await expect(page).toHaveURL('/dashboard')
})
```

### Visual Testing

```typescript
test('visual comparison', async ({ page }) => {
  await page.goto('/dashboard')
  await page.waitForLoadState('networkidle')
  
  // Take screenshot for visual comparison
  await expect(page).toHaveScreenshot('dashboard.png')
})
```

## Test Data Generation

Use Faker.js for generating realistic test data:

```typescript
import { faker } from '@faker-js/faker'

export const createMockExpense = (overrides = {}) => ({
  id: faker.string.uuid(),
  amount: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
  description: faker.commerce.productName(),
  category: faker.helpers.arrayElement(['Food', 'Transport', 'Entertainment']),
  date: faker.date.recent().toISOString(),
  ...overrides,
})
```

## Mocking APIs

MSW is configured to intercept network requests:

```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('*/rest/v1/expenses', () => {
    return HttpResponse.json([
      { id: '1', amount: 25.50, description: 'Coffee' }
    ])
  }),
]
```

## CI/CD Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main`

The CI pipeline:
1. Runs linting
2. Executes unit tests with coverage
3. Runs e2e tests
4. Builds the application
5. Uploads test reports and artifacts

## Best Practices

### Unit Tests
- Test behavior, not implementation
- Use descriptive test names
- Follow Arrange-Act-Assert pattern
- Mock external dependencies
- Aim for meaningful coverage, not just high percentages

### E2E Tests
- Use Page Object Model for maintainable tests
- Test critical user journeys
- Use data-testid attributes for reliable element selection
- Take screenshots for visual regression testing
- Keep tests independent and idempotent
- Always use the configured test user (`E2E_USERNAME`) for consistency
- Don't worry about manual cleanup - the global teardown handles it automatically

### General
- Run tests in watch mode during development
- Write tests before fixing bugs (TDD)
- Keep tests simple and focused
- Use meaningful assertions with clear error messages

## Debugging Tests

### Unit Tests
```bash
# Run specific test file
npm run test -- button.test.tsx

# Run tests matching pattern
npm run test -- --grep "should handle click"

# Run with verbose output
npm run test -- --reporter=verbose
```

### E2E Tests
```bash
# Debug mode (opens browser dev tools)
npm run test:e2e:debug

# Run with trace viewer
npx playwright test --trace on

# Show test results
npx playwright show-report
```

## Coverage Reports

Coverage reports are generated in the `coverage/` directory:
- `coverage/index.html` - Interactive HTML report
- `coverage/lcov.info` - LCOV format for CI tools

Open `coverage/index.html` in your browser to see detailed coverage information.

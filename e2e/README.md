# E2E Tests

This directory contains end-to-end tests using Playwright with Page Object Model pattern.

## Setup

Create a `.env.test` file in the project root with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key

# Test User Credentials
E2E_USERNAME=test@example.com
E2E_PASSWORD=your-test-password
```

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug
```

## Structure

```
e2e/
├── page-objects/          # Page Object Models for reusable page interactions
│   ├── BasePage.ts       # Base class with common functionality
│   ├── LoginPage.ts      # Login page interactions
│   ├── ExpensesPage.ts   # Expenses page interactions
│   ├── ExpensesTable.ts  # Expenses table interactions
│   └── ExpenseFormModal.ts # Expense form modal interactions
├── global-teardown.ts    # Cleanup script (runs after all tests)
├── auth.spec.ts          # Authentication tests
├── auth-pom.spec.ts      # Authentication tests (using POM)
├── expenses.spec.ts      # Expenses tests
└── expenses-pom.spec.ts  # Expenses tests (using POM)
```

## Page Object Model

All page interactions should use the Page Object Model pattern for better maintainability:

```typescript
import { ExpensesPage, LoginPage } from './page-objects'

test('should add expense', async ({ page }) => {
  const loginPage = new LoginPage(page)
  await loginPage.performLogin()
  
  const expensesPage = new ExpensesPage(page)
  await expensesPage.goto()
  await expensesPage.addExpense({
    name: 'Test Expense',
    amount: '100.00',
    date: '2024-01-01'
  })
})
```

## Database Cleanup

### Automatic Cleanup

After all tests complete, the `global-teardown.ts` script automatically:

1. Authenticates as the test user
2. Deletes all expenses created by the test user
3. Signs out the test user

This ensures a clean state for the next test run.

### Manual Cleanup

If you need to manually clean up test data:

```bash
npx tsx e2e/global-teardown.ts
```

### How It Works

The teardown is configured in `playwright.config.ts`:

```typescript
export default defineConfig({
  globalTeardown: './e2e/global-teardown.ts',
  // ...
})
```

The script:
- Uses the Supabase client to connect to the database
- Signs in with `E2E_USERNAME` and `E2E_PASSWORD`
- Deletes all entries from the `expenses` table where `user_id` matches the test user
- Logs the number of deleted records for debugging

### Important Notes

- The teardown script **does not fail the test suite** if cleanup fails
- Teardown runs **after all tests complete**, not after each test
- Tests should be idempotent and able to handle existing data
- The test user account itself is **not deleted**, only their expenses

## Best Practices

1. **Use Test User**: Always authenticate with the configured test user (`E2E_USERNAME`)
2. **Page Object Model**: Use POMs for all page interactions
3. **Data Attributes**: Use `data-testid` attributes for reliable element selection
4. **Independent Tests**: Each test should be independent and not rely on test order
5. **Wait for Elements**: Always wait for elements to be visible/enabled before interacting
6. **Error Handling**: Include try-catch blocks in complex test scenarios
7. **Timeouts**: Set appropriate timeouts for slow operations (network, database)

## Debugging

### View Test Results

```bash
# Show HTML report
npx playwright show-report
```

### Debug Failed Tests

```bash
# Run with trace
npx playwright test --trace on

# Debug specific test
npx playwright test --debug auth.spec.ts
```

### Common Issues

**Test timeout**: Increase timeout in test or config
```typescript
test.setTimeout(90000) // 90 seconds
```

**Element not found**: Check if element has correct data-testid or wait for it to load
```typescript
await page.waitForSelector('[data-testid="element"]', { timeout: 10000 })
```

**Authentication fails**: Verify `.env.test` credentials are correct


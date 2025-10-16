import { expect } from "@playwright/test";
import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";
import { ExpenseFormModal } from "./ExpenseFormModal";
import type { ExpenseFormData } from "./ExpenseFormModal";
import { ExpensesTable } from "./ExpensesTable";

/**
 * Main Page Object Model for Expenses Page
 * Orchestrates interactions between different components on the expenses page
 */
export class ExpensesPage extends BasePage {
  // Child page objects
  readonly expenseFormModal: ExpenseFormModal;
  readonly expensesTable: ExpensesTable;

  // Page elements
  readonly addExpenseButton: Locator;
  readonly addFirstExpenseButton: Locator;
  readonly pageTitle: Locator;
  readonly emptyStateContainer: Locator;
  readonly loadingSpinner: Locator;
  readonly errorMessage: Locator;

  // Filter controls
  readonly filterControls: Locator;

  // Pagination
  readonly pagination: Locator;
  readonly nextPageButton: Locator;
  readonly prevPageButton: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize child page objects
    this.expenseFormModal = new ExpenseFormModal(page);
    this.expensesTable = new ExpensesTable(page);

    // Initialize page elements using data-testid and semantic selectors
    this.addExpenseButton = this.getByTestId("add-expense-button");
    this.addFirstExpenseButton = this.getByTestId("add-first-expense-button");
    this.pageTitle = page.getByRole("heading", { name: /wydatki/i, level: 1 });
    this.emptyStateContainer = page.locator(
      ".flex.flex-col.items-center.justify-center.rounded-lg.border.border-dashed"
    );
    // Loading spinner within the status role container (main page loading)
    this.loadingSpinner = page.locator('[role="status"] .animate-spin');
    this.errorMessage = page.locator('[role="alert"]');

    // Filter and pagination
    this.filterControls = page.locator(".mb-6.space-y-4.rounded-lg.border.bg-card.p-4");
    this.pagination = page.locator(".mt-6.flex.flex-col.items-center.gap-4.border-t.pt-4");
    this.nextPageButton = page.getByRole("button", { name: /następna strona/i });
    this.prevPageButton = page.getByRole("button", { name: /poprzednia strona/i });
  }

  /**
   * Navigate to expenses page
   */
  async goto(): Promise<void> {
    await super.goto("/expenses");
    await this.waitForPageLoad();
    await this.waitForElement(this.pageTitle);
  }

  /**
   * Open add expense modal using main button
   */
  async openAddExpenseModal(): Promise<void> {
    if (!(await this.isPageActive())) {
      throw new Error("Page has been closed or is no longer active");
    }
    await this.clickElement(this.addExpenseButton, 10000);
    // Wait a bit for modal to start opening
    await this.safeWait(100);
    await this.expenseFormModal.waitForModalToOpen();
  }

  /**
   * Open add expense modal using "add first expense" button (when list is empty)
   */
  async openAddFirstExpenseModal(): Promise<void> {
    if (!(await this.isPageActive())) {
      throw new Error("Page has been closed or is no longer active");
    }
    await this.clickElement(this.addFirstExpenseButton, 10000);
    // Wait a bit for modal to start opening
    await this.safeWait(100);
    await this.expenseFormModal.waitForModalToOpen();
  }

  /**
   * Add new expense (complete flow)
   */
  async addExpense(expense: ExpenseFormData): Promise<void> {
    // Check if we need to use the "add first expense" button
    const wasEmpty = await this.isExpenseListEmpty();

    if (wasEmpty) {
      await this.openAddFirstExpenseModal();
    } else {
      await this.openAddExpenseModal();
    }

    await this.expenseFormModal.createExpense(expense);

    // After adding expense, data will be refetched automatically by useExpenses hook
    // Wait for the network request to complete and page to update
    await this.page.waitForLoadState("networkidle", { timeout: 15000 });

    // Give React a moment to render the new state
    await this.safeWait(500);

    // Now wait for the appropriate UI state
    await this.waitForExpensesToLoad();
  }

  /**
   * Edit existing expense
   */
  async editExpense(expenseId: string, updates: Partial<ExpenseFormData>): Promise<void> {
    if (!(await this.isPageActive())) {
      throw new Error("Page has been closed or is no longer active");
    }
    await this.expensesTable.editExpense(expenseId);
    // Wait a bit for modal to start opening
    await this.safeWait(100);
    await this.expenseFormModal.editExpense(updates);
  }

  /**
   * Delete expense with confirmation
   */
  async deleteExpense(expenseId: string): Promise<void> {
    if (!(await this.isPageActive())) {
      throw new Error("Page has been closed or is no longer active");
    }
    await this.expensesTable.deleteExpense(expenseId);

    // Wait for confirmation dialog to appear
    await this.safeWait(200);

    // Handle confirmation dialog
    const confirmButton = this.page.getByRole("button", { name: /potwierdź/i });
    await this.clickElement(confirmButton, 10000);
  }

  /**
   * Check if expense list is empty
   */
  async isExpenseListEmpty(): Promise<boolean> {
    return await this.emptyStateContainer.isVisible();
  }

  /**
   * Check if page is in loading state
   */
  async isLoading(): Promise<boolean> {
    return await this.loadingSpinner.isVisible();
  }

  /**
   * Check if there's an error message
   */
  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    if (await this.hasError()) {
      return (await this.errorMessage.textContent()) || "";
    }
    return "";
  }

  /**
   * Wait for expenses to load
   */
  async waitForExpensesToLoad(): Promise<void> {
    if (!(await this.isPageActive())) {
      throw new Error("Page has been closed or is no longer active");
    }

    // Wait for loading to finish
    await this.safeExpect(() => expect(this.loadingSpinner).not.toBeVisible({ timeout: 15000 }));

    // Give React time to render after loading finishes
    await this.safeWait(300);

    // Check which state we're in - either table with data or empty state
    const hasEmptyState = await this.emptyStateContainer.isVisible();

    if (!hasEmptyState) {
      // We should have data, so table should be present
      // Wait for table to be rendered
      await this.expensesTable.waitForTableToLoad();
    }
    // If empty state is visible, we're done - no table expected
  }

  /**
   * Verify expense was added successfully
   */
  async verifyExpenseAdded(expenseId: string, expectedData?: Partial<ExpenseFormData>): Promise<void> {
    await this.waitForExpensesToLoad();
    await this.expensesTable.verifyExpenseExists(expenseId);

    if (expectedData) {
      await this.expensesTable.verifyExpenseData(expenseId, {
        name: expectedData.name,
        amount: expectedData.amount,
        description: expectedData.description,
      });
    }
  }

  /**
   * Verify expense was deleted successfully
   */
  async verifyExpenseDeleted(expenseId: string): Promise<void> {
    await this.waitForExpensesToLoad();
    await this.expensesTable.verifyExpenseNotExists(expenseId);
  }

  /**
   * Get current expense count
   */
  async getExpenseCount(): Promise<number> {
    if (await this.isExpenseListEmpty()) {
      return 0;
    }
    return await this.expensesTable.getExpenseCount();
  }

  /**
   * Navigate to next page
   */
  async goToNextPage(): Promise<void> {
    await this.clickElement(this.nextPageButton);
    await this.waitForExpensesToLoad();
  }

  /**
   * Navigate to previous page
   */
  async goToPreviousPage(): Promise<void> {
    await this.clickElement(this.prevPageButton);
    await this.waitForExpensesToLoad();
  }

  /**
   * Sort expenses by amount
   */
  async sortByAmount(): Promise<void> {
    await this.expensesTable.sortByAmount();
    await this.waitForExpensesToLoad();
  }

  /**
   * Sort expenses by date
   */
  async sortByDate(): Promise<void> {
    await this.expensesTable.sortByDate();
    await this.waitForExpensesToLoad();
  }

  /**
   * Verify page is loaded correctly
   */
  async verifyPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.pageTitle).toHaveText("Wydatki");
    await expect(this.addExpenseButton).toBeVisible();
  }

  /**
   * Verify empty state is displayed
   */
  async verifyEmptyState(): Promise<void> {
    await expect(this.emptyStateContainer).toBeVisible();
    await expect(this.addFirstExpenseButton).toBeVisible();
    await expect(this.page.getByText("Brak wydatków")).toBeVisible();
  }

  /**
   * Take screenshot of the expenses page
   */
  async takeExpensesPageScreenshot(name = "expenses-page"): Promise<void> {
    await this.takeScreenshot(name);
  }
}

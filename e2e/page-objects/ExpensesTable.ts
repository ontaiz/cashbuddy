import { expect } from "@playwright/test";
import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export interface ExpenseRowData {
  id: string;
  name: string;
  amount: string;
  date: string;
  description?: string;
}

/**
 * Page Object Model for Expenses Table/List component
 * Handles both desktop table view and mobile card view
 */
export class ExpensesTable extends BasePage {
  // Main containers
  readonly desktopTableContainer: Locator;
  readonly mobileTableContainer: Locator;

  // Table elements (desktop)
  readonly table: Locator;
  readonly tableRows: Locator;
  readonly tableHeaders: Locator;

  // Card elements (mobile)
  readonly cardContainer: Locator;
  readonly expenseCards: Locator;

  // Sort buttons
  readonly sortByAmountButton: Locator;
  readonly sortByDateButton: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators using combined CSS selectors to distinguish desktop/mobile
    // Desktop: has 'md:block' class and rounded-md border
    // Mobile: has 'md:hidden' class and grid
    this.desktopTableContainer = page.locator('[data-testid="expenses-table"].md\\:block');
    this.mobileTableContainer = page.locator('[data-testid="expenses-table"].md\\:hidden');

    // Desktop table view
    this.table = this.desktopTableContainer.locator("table");
    this.tableRows = this.table.locator("tbody tr");
    this.tableHeaders = this.table.locator("thead th");

    // Mobile card view
    this.cardContainer = this.mobileTableContainer;
    this.expenseCards = this.cardContainer.locator('[data-testid^="expense-card-"]');

    // Sort buttons
    this.sortByAmountButton = this.page.getByRole("button", { name: /kwota/i });
    this.sortByDateButton = this.page.getByRole("button", { name: /data/i });
  }

  /**
   * Wait for table to be visible (either desktop or mobile view)
   */
  async waitForTableToLoad(): Promise<void> {
    // Wait for the expenses table container to be attached to DOM
    // Both desktop and mobile versions use the same data-testid
    await this.page.waitForSelector('[data-testid="expenses-table"]', {
      state: "attached",
      timeout: 10000,
    });

    // Give it a small delay for CSS to apply and determine which view is visible
    await this.page.waitForTimeout(100);
  }

  /**
   * Get expense row by ID (desktop view)
   */
  getExpenseRow(expenseId: string): Locator {
    return this.getByTestId(`expense-row-${expenseId}`);
  }

  /**
   * Get expense card by ID (mobile view)
   */
  getExpenseCard(expenseId: string): Locator {
    return this.getByTestId(`expense-card-${expenseId}`);
  }

  /**
   * Get all visible expense rows/cards
   */
  async getAllExpenses(): Promise<Locator> {
    // Check if desktop or mobile view is visible
    const isDesktop = await this.desktopTableContainer.isVisible();
    return isDesktop ? this.tableRows : this.expenseCards;
  }

  /**
   * Get expense count
   */
  async getExpenseCount(): Promise<number> {
    const expenses = await this.getAllExpenses();
    return await expenses.count();
  }

  /**
   * Get expense data from row/card by ID
   */
  async getExpenseData(expenseId: string): Promise<ExpenseRowData> {
    const isDesktop = await this.desktopTableContainer.isVisible();

    if (isDesktop) {
      return await this.getExpenseDataFromRow(expenseId);
    } else {
      return await this.getExpenseDataFromCard(expenseId);
    }
  }

  /**
   * Get expense data from desktop table row
   */
  private async getExpenseDataFromRow(expenseId: string): Promise<ExpenseRowData> {
    const row = this.getExpenseRow(expenseId);
    const cells = row.locator("td");

    const name = (await cells.nth(0).textContent()) || "";
    const amount = (await cells.nth(1).textContent()) || "";
    const date = (await cells.nth(2).textContent()) || "";
    const description = (await cells.nth(3).textContent()) || "";

    return {
      id: expenseId,
      name: name.trim(),
      amount: amount.trim(),
      date: date.trim(),
      description: description.trim() === "-" ? undefined : description.trim(),
    };
  }

  /**
   * Get expense data from mobile card
   */
  private async getExpenseDataFromCard(expenseId: string): Promise<ExpenseRowData> {
    const card = this.getExpenseCard(expenseId);

    const name = (await card.locator("h3").textContent()) || "";
    const amount = (await card.locator(".text-2xl.font-bold").textContent()) || "";
    const date = (await card.locator(".flex.items-center.gap-2 span").textContent()) || "";
    const descriptionElement = card.locator("p.text-muted-foreground").last();
    const description = (await descriptionElement.isVisible()) ? await descriptionElement.textContent() : undefined;

    return {
      id: expenseId,
      name: name.trim(),
      amount: amount.trim(),
      date: date.trim(),
      description: description?.trim(),
    };
  }

  /**
   * Click edit button for specific expense
   */
  async editExpense(expenseId: string): Promise<void> {
    const isDesktop = await this.desktopTableContainer.isVisible();

    if (isDesktop) {
      const row = this.getExpenseRow(expenseId);
      const editButton = row.getByRole("button", { name: /edytuj wydatek/i });
      await this.clickElement(editButton);
    } else {
      const card = this.getExpenseCard(expenseId);
      const editButton = card.getByRole("button", { name: /edytuj wydatek/i });
      await this.clickElement(editButton);
    }
  }

  /**
   * Click delete button for specific expense
   */
  async deleteExpense(expenseId: string): Promise<void> {
    const isDesktop = await this.desktopTableContainer.isVisible();

    if (isDesktop) {
      const row = this.getExpenseRow(expenseId);
      const deleteButton = row.getByRole("button", { name: /usuń wydatek/i });
      await this.clickElement(deleteButton);
    } else {
      const card = this.getExpenseCard(expenseId);
      const deleteButton = card.getByRole("button", { name: /usuń wydatek/i });
      await this.clickElement(deleteButton);
    }
  }

  /**
   * Sort expenses by amount
   */
  async sortByAmount(): Promise<void> {
    await this.clickElement(this.sortByAmountButton);
  }

  /**
   * Sort expenses by date
   */
  async sortByDate(): Promise<void> {
    await this.clickElement(this.sortByDateButton);
  }

  /**
   * Verify expense exists in table
   */
  async verifyExpenseExists(expenseId: string): Promise<void> {
    const isDesktop = await this.desktopTableContainer.isVisible();

    if (isDesktop) {
      await expect(this.getExpenseRow(expenseId)).toBeVisible();
    } else {
      await expect(this.getExpenseCard(expenseId)).toBeVisible();
    }
  }

  /**
   * Verify expense does not exist in table
   */
  async verifyExpenseNotExists(expenseId: string): Promise<void> {
    const isDesktop = await this.desktopTableContainer.isVisible();

    if (isDesktop) {
      await expect(this.getExpenseRow(expenseId)).not.toBeVisible();
    } else {
      await expect(this.getExpenseCard(expenseId)).not.toBeVisible();
    }
  }

  /**
   * Verify expense data matches expected values
   */
  async verifyExpenseData(expenseId: string, expectedData: Partial<ExpenseRowData>): Promise<void> {
    const actualData = await this.getExpenseData(expenseId);

    if (expectedData.name) {
      expect(actualData.name).toBe(expectedData.name);
    }
    if (expectedData.amount) {
      // Normalize both amounts for comparison (remove spaces, currency symbols, convert to same decimal separator)
      const normalizeAmount = (amount: string) => {
        return amount
          .replace(/\s+/g, "") // Remove spaces
          .replace(/zł/g, "") // Remove currency symbol
          .replace(/,/g, ".") // Convert comma to dot
          .trim();
      };
      const normalizedActual = normalizeAmount(actualData.amount);
      const normalizedExpected = normalizeAmount(expectedData.amount);
      expect(normalizedActual).toContain(normalizedExpected);
    }
    if (expectedData.date) {
      expect(actualData.date).toContain(expectedData.date);
    }
    if (expectedData.description !== undefined) {
      expect(actualData.description).toBe(expectedData.description);
    }
  }

  /**
   * Get all expense IDs currently visible
   */
  async getAllExpenseIds(): Promise<string[]> {
    const isDesktop = await this.desktopTableContainer.isVisible();
    const expenses = await this.getAllExpenses();
    const count = await expenses.count();
    const ids: string[] = [];

    for (let i = 0; i < count; i++) {
      const expense = expenses.nth(i);
      const testId = await expense.getAttribute("data-testid");
      if (testId) {
        const id = testId.replace(isDesktop ? "expense-row-" : "expense-card-", "");
        ids.push(id);
      }
    }

    return ids;
  }

  /**
   * Verify table is empty
   */
  async verifyTableIsEmpty(): Promise<void> {
    const count = await this.getExpenseCount();
    expect(count).toBe(0);
  }

  /**
   * Verify table has specific number of expenses
   */
  async verifyExpenseCount(expectedCount: number): Promise<void> {
    const actualCount = await this.getExpenseCount();
    expect(actualCount).toBe(expectedCount);
  }
}

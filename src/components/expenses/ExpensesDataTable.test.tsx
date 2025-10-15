import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import { faker } from "@faker-js/faker";
import ExpensesDataTable from "./ExpensesDataTable";
import type { ExpenseDto } from "@/types";

describe("ExpensesDataTable", () => {
  // Test data generators
  const generateMockExpense = (overrides?: Partial<ExpenseDto>): ExpenseDto => ({
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    amount: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
    date: faker.date.recent().toISOString().split("T")[0],
    description: faker.lorem.sentence(),
    created_at: faker.date.recent().toISOString(),
    ...overrides,
  });

  const generateMockExpenses = (count: number): ExpenseDto[] =>
    Array.from({ length: count }, () => generateMockExpense());

  // Mock functions
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnSort = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render empty table when no expenses provided", () => {
      render(
        <ExpensesDataTable
          expenses={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSort={mockOnSort}
        />
      );

      // Desktop table should be present but empty
      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getByText("Nazwa")).toBeInTheDocument();
      expect(screen.getByText("Kwota")).toBeInTheDocument();
      expect(screen.getByText("Data")).toBeInTheDocument();
      expect(screen.getByText("Opis")).toBeInTheDocument();
      expect(screen.getByText("Akcje")).toBeInTheDocument();
    });

    it("should render expenses in desktop table view", () => {
      const expenses = generateMockExpenses(3);
      
      render(
        <ExpensesDataTable
          expenses={expenses}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSort={mockOnSort}
        />
      );

      // Check if all expenses are rendered (each appears in both desktop and mobile views)
      expenses.forEach((expense) => {
        expect(screen.getAllByText(expense.name)).toHaveLength(2); // Desktop + Mobile
        expect(screen.getAllByText(expense.description!)).toHaveLength(2); // Desktop + Mobile
      });

      // Check if action buttons are present (2 buttons per expense)
      const editButtons = screen.getAllByLabelText("Edytuj wydatek");
      const deleteButtons = screen.getAllByLabelText("Usuń wydatek");
      expect(editButtons).toHaveLength(expenses.length * 2); // Desktop + Mobile views
      expect(deleteButtons).toHaveLength(expenses.length * 2); // Desktop + Mobile views
    });

    it("should render expenses in mobile card view", () => {
      const expenses = generateMockExpenses(2);
      
      render(
        <ExpensesDataTable
          expenses={expenses}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSort={mockOnSort}
        />
      );

      // Mobile cards should be present (hidden by CSS but in DOM)
      expenses.forEach((expense) => {
        // Name should appear in both desktop table and mobile cards
        const nameElements = screen.getAllByText(expense.name);
        expect(nameElements.length).toBeGreaterThanOrEqual(1);
      });
    });

    it("should handle expenses with empty description", () => {
      const expenseWithoutDescription = generateMockExpense({
        description: null,
      });
      
      render(
        <ExpensesDataTable
          expenses={[expenseWithoutDescription]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSort={mockOnSort}
        />
      );

      // Should display "-" for empty description in desktop view
      expect(screen.getByText("-")).toBeInTheDocument();
    });
  });

  describe("Formatting Functions", () => {
    it("should format amounts correctly in PLN currency", () => {
      const testCases = [
        { amount: 123.45, expected: "123,45 zł" },
        { amount: 1000, expected: "1000,00 zł" },
        { amount: 0.99, expected: "0,99 zł" },
        { amount: 1234567.89, expected: "1 234 567,89 zł" },
      ];

      testCases.forEach(({ amount, expected }) => {
        const expense = generateMockExpense({ amount });
        
        const { unmount } = render(
          <ExpensesDataTable
            expenses={[expense]}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
            onSort={mockOnSort}
          />
        );

        // Should appear in both desktop and mobile views
        expect(screen.getAllByText(expected)).toHaveLength(2);
        
        // Clean up for next iteration
        unmount();
      });
    });

    it("should format dates correctly in Polish locale", () => {
      const testCases = [
        { date: "2024-01-15", expected: "15 stycznia 2024" },
        { date: "2024-12-31", expected: "31 grudnia 2024" },
        { date: "2024-06-01", expected: "1 czerwca 2024" },
      ];

      testCases.forEach(({ date, expected }) => {
        const expense = generateMockExpense({ date });
        
        const { unmount } = render(
          <ExpensesDataTable
            expenses={[expense]}
            onEdit={mockOnEdit}
            onDelete={mockOnDelete}
            onSort={mockOnSort}
          />
        );

        // Should appear in both desktop and mobile views
        expect(screen.getAllByText(expected)).toHaveLength(2);
        
        // Clean up for next iteration
        unmount();
      });
    });
  });

  describe("User Interactions", () => {
    it("should call onSort with 'amount' when amount header is clicked", async () => {
      const user = userEvent.setup();
      const expenses = generateMockExpenses(1);
      
      render(
        <ExpensesDataTable
          expenses={expenses}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSort={mockOnSort}
        />
      );

      const amountSortButton = screen.getByRole("button", { name: /kwota/i });
      await user.click(amountSortButton);

      expect(mockOnSort).toHaveBeenCalledWith("amount");
      expect(mockOnSort).toHaveBeenCalledTimes(1);
    });

    it("should call onSort with 'date' when date header is clicked", async () => {
      const user = userEvent.setup();
      const expenses = generateMockExpenses(1);
      
      render(
        <ExpensesDataTable
          expenses={expenses}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSort={mockOnSort}
        />
      );

      const dateSortButton = screen.getByRole("button", { name: /data/i });
      await user.click(dateSortButton);

      expect(mockOnSort).toHaveBeenCalledWith("date");
      expect(mockOnSort).toHaveBeenCalledTimes(1);
    });

    it("should call onEdit with correct expense when edit button is clicked", async () => {
      const user = userEvent.setup();
      const expense = generateMockExpense();
      
      render(
        <ExpensesDataTable
          expenses={[expense]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSort={mockOnSort}
        />
      );

      const editButtons = screen.getAllByLabelText("Edytuj wydatek");
      await user.click(editButtons[0]); // Click first edit button (desktop view)

      expect(mockOnEdit).toHaveBeenCalledWith(expense);
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it("should call onDelete with correct expense ID when delete button is clicked", async () => {
      const user = userEvent.setup();
      const expense = generateMockExpense();
      
      render(
        <ExpensesDataTable
          expenses={[expense]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSort={mockOnSort}
        />
      );

      const deleteButtons = screen.getAllByLabelText("Usuń wydatek");
      await user.click(deleteButtons[0]); // Click first delete button (desktop view)

      expect(mockOnDelete).toHaveBeenCalledWith(expense.id);
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it("should handle multiple expenses interactions correctly", async () => {
      const user = userEvent.setup();
      const expenses = generateMockExpenses(3);
      
      render(
        <ExpensesDataTable
          expenses={expenses}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSort={mockOnSort}
        />
      );

      const editButtons = screen.getAllByLabelText("Edytuj wydatek");
      const deleteButtons = screen.getAllByLabelText("Usuń wydatek");

      // Click edit on second expense (desktop view - index 1)
      await user.click(editButtons[1]);
      expect(mockOnEdit).toHaveBeenCalledWith(expenses[1]);

      // Click delete on third expense (desktop view - index 2)
      await user.click(deleteButtons[2]);
      expect(mockOnDelete).toHaveBeenCalledWith(expenses[2].id);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels for action buttons", () => {
      const expense = generateMockExpense();
      
      render(
        <ExpensesDataTable
          expenses={[expense]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSort={mockOnSort}
        />
      );

      // Check ARIA labels
      expect(screen.getAllByLabelText("Edytuj wydatek")).toHaveLength(2); // Desktop + Mobile
      expect(screen.getAllByLabelText("Usuń wydatek")).toHaveLength(2); // Desktop + Mobile
    });

    it("should have proper table structure", () => {
      const expenses = generateMockExpenses(2);
      
      render(
        <ExpensesDataTable
          expenses={expenses}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSort={mockOnSort}
        />
      );

      // Check table structure
      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getAllByRole("columnheader")).toHaveLength(5); // 5 columns
      expect(screen.getAllByRole("row")).toHaveLength(3); // Header + 2 data rows
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long expense names", () => {
      const longName = faker.lorem.words(20); // Very long name
      const expense = generateMockExpense({ name: longName });
      
      render(
        <ExpensesDataTable
          expenses={[expense]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSort={mockOnSort}
        />
      );

      // Should appear in both desktop and mobile views
      expect(screen.getAllByText(longName)).toHaveLength(2);
    });

    it("should handle very long descriptions", () => {
      const longDescription = faker.lorem.sentences(10); // Very long description
      const expense = generateMockExpense({ description: longDescription });
      
      render(
        <ExpensesDataTable
          expenses={[expense]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSort={mockOnSort}
        />
      );

      // Description should appear in both desktop and mobile views
      expect(screen.getAllByText(longDescription)).toHaveLength(2);
    });

    it("should handle zero amount", () => {
      const expense = generateMockExpense({ amount: 0 });
      
      render(
        <ExpensesDataTable
          expenses={[expense]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSort={mockOnSort}
        />
      );

      // Should appear in both desktop and mobile views
      expect(screen.getAllByText("0,00 zł")).toHaveLength(2);
    });

    it("should handle negative amounts", () => {
      const expense = generateMockExpense({ amount: -50.25 });
      
      render(
        <ExpensesDataTable
          expenses={[expense]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
          onSort={mockOnSort}
        />
      );

      // Should appear in both desktop and mobile views
      expect(screen.getAllByText("-50,25 zł")).toHaveLength(2);
    });
  });
});

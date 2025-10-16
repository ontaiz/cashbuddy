import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { faker } from "@faker-js/faker";
import ExpenseFormModal from "./ExpenseFormModal";
import type { ExpenseDto } from "@/types";

describe("ExpenseFormModal", () => {
  // Test data generators
  const generateMockExpense = (overrides?: Partial<ExpenseDto>): ExpenseDto => ({
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    amount: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
    date: faker.date.recent().toISOString(),
    description: faker.lorem.sentence(),
    created_at: faker.date.recent().toISOString(),
    ...overrides,
  });

  // Mock functions
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSave.mockResolvedValue(undefined);
  });

  describe("Rendering", () => {
    it("should not render when isOpen is false", () => {
      render(<ExpenseFormModal isOpen={false} onClose={mockOnClose} onSave={mockOnSave} />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should render add mode when no initialData provided", () => {
      render(<ExpenseFormModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Dodaj wydatek")).toBeInTheDocument();
      expect(screen.getByText("Wypełnij formularz i kliknij zapisz, aby dodać nowy wydatek.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /zapisz/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /anuluj/i })).toBeInTheDocument();
    });

    it("should render edit mode when initialData provided", () => {
      const expense = generateMockExpense();

      render(<ExpenseFormModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} initialData={expense} />);

      expect(screen.getByText("Edytuj wydatek")).toBeInTheDocument();
      expect(screen.getByText("Wprowadź zmiany i kliknij zapisz.")).toBeInTheDocument();
    });

    it("should render all form fields", () => {
      render(<ExpenseFormModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);

      // Check required fields
      expect(screen.getByLabelText(/nazwa/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/kwota/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/data/i)).toBeInTheDocument();

      // Check optional field
      expect(screen.getByLabelText(/opis/i)).toBeInTheDocument();

      // Check required field indicators
      expect(screen.getAllByText("*")).toHaveLength(3); // Name, Amount, Date
    });

    it("should populate form fields with initialData in edit mode", () => {
      const expense = generateMockExpense({
        name: "Test Expense",
        amount: 123.45,
        date: "2024-01-15T12:00:00.000Z",
        description: "Test description",
      });

      render(<ExpenseFormModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} initialData={expense} />);

      expect(screen.getByDisplayValue("Test Expense")).toBeInTheDocument();
      expect(screen.getByDisplayValue("123.45")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Test description")).toBeInTheDocument();
      // Date should be formatted for display
      expect(screen.getByText("15 stycznia 2024")).toBeInTheDocument();
    });

    it("should handle initialData with null description", () => {
      const expense = generateMockExpense({
        description: null,
      });

      render(<ExpenseFormModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} initialData={expense} />);

      const descriptionField = screen.getByLabelText(/opis/i);
      expect(descriptionField).toHaveValue("");
    });
  });

  describe("User Interactions", () => {
    it("should handle form submission with valid data in add mode", async () => {
      const user = userEvent.setup();

      render(<ExpenseFormModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);

      // Fill out the form
      await user.type(screen.getByLabelText(/nazwa/i), "Test Expense");
      await user.type(screen.getByLabelText(/kwota/i), "123.45");
      await user.type(screen.getByLabelText(/opis/i), "Test description");

      // Submit the form
      await user.click(screen.getByRole("button", { name: /zapisz/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          name: "Test Expense",
          amount: 123.45,
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/), // ISO date
          description: "Test description",
        });
      });
    });

    it("should handle form submission in edit mode", async () => {
      const user = userEvent.setup();
      const expense = generateMockExpense({
        name: "Original Name",
        amount: 100,
        description: "Original description",
      });

      render(<ExpenseFormModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} initialData={expense} />);

      // Modify the form
      const nameField = screen.getByDisplayValue("Original Name");
      await user.clear(nameField);
      await user.type(nameField, "Updated Name");

      const amountField = screen.getByDisplayValue("100");
      await user.clear(amountField);
      await user.type(amountField, "200.50");

      // Submit the form
      await user.click(screen.getByRole("button", { name: /zapisz/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          name: "Updated Name",
          amount: 200.5,
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          description: "Original description",
        });
      });
    });

    it("should handle empty description correctly", async () => {
      const user = userEvent.setup();

      render(<ExpenseFormModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);

      // Fill required fields only
      await user.type(screen.getByLabelText(/nazwa/i), "Test Expense");
      await user.type(screen.getByLabelText(/kwota/i), "123.45");
      // Leave description empty

      await user.click(screen.getByRole("button", { name: /zapisz/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          name: "Test Expense",
          amount: 123.45,
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          description: undefined, // Should be undefined for empty description
        });
      });
    });

    it("should trim whitespace from input fields", async () => {
      const user = userEvent.setup();

      render(<ExpenseFormModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);

      // Add whitespace around values
      await user.type(screen.getByLabelText(/nazwa/i), "  Test Expense  ");
      await user.type(screen.getByLabelText(/kwota/i), "123.45");
      await user.type(screen.getByLabelText(/opis/i), "  Test description  ");

      await user.click(screen.getByRole("button", { name: /zapisz/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          name: "Test Expense", // Trimmed
          amount: 123.45,
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          description: "Test description", // Trimmed
        });
      });
    });

    it("should call onClose when cancel button is clicked", async () => {
      const user = userEvent.setup();

      render(<ExpenseFormModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);

      await user.click(screen.getByRole("button", { name: /anuluj/i }));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe("Date Handling", () => {
    it("should display current date as default in add mode", () => {
      render(<ExpenseFormModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);

      // Should show today's date formatted in Polish
      const today = new Date();
      const expectedFormat = new Intl.DateTimeFormat("pl-PL", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(today);

      expect(screen.getByText(expectedFormat)).toBeInTheDocument();
    });

    it("should format date correctly for display", () => {
      const expense = generateMockExpense({
        date: "2024-03-15T12:00:00.000Z",
      });

      render(<ExpenseFormModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} initialData={expense} />);

      expect(screen.getByText("15 marca 2024")).toBeInTheDocument();
    });
  });

  describe("Loading States", () => {
    it("should show loading state during form submission", async () => {
      const user = userEvent.setup();

      // Make onSave return a pending promise
      let resolvePromise: (() => void) | undefined;
      const pendingPromise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });
      mockOnSave.mockReturnValue(pendingPromise);

      render(<ExpenseFormModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/nazwa/i), "Test");
      await user.type(screen.getByLabelText(/kwota/i), "100");

      const submitButton = screen.getByRole("button", { name: /zapisz/i });
      await user.click(submitButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText("Zapisywanie...")).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
        expect(screen.getByRole("button", { name: /anuluj/i })).toBeDisabled();
      });

      // Resolve the promise
      if (resolvePromise) resolvePromise();

      await waitFor(() => {
        expect(screen.queryByText("Zapisywanie...")).not.toBeInTheDocument();
      });
    });

    it("should handle submission errors gracefully", async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
        // Intentionally empty to suppress error logs during testing
      });

      // Make onSave reject
      mockOnSave.mockRejectedValue(new Error("Save failed"));

      render(<ExpenseFormModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/nazwa/i), "Test");
      await user.type(screen.getByLabelText(/kwota/i), "100");

      await user.click(screen.getByRole("button", { name: /zapisz/i }));

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to save expense:", expect.any(Error));
      });

      // Form should be enabled again
      expect(screen.getByRole("button", { name: /zapisz/i })).toBeEnabled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      render(<ExpenseFormModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);

      // Dialog should have proper role
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      // Form fields should have proper labels
      expect(screen.getByLabelText(/nazwa/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/kwota/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/data/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/opis/i)).toBeInTheDocument();

      // Required fields should be marked
      const nameField = screen.getByLabelText(/nazwa/i);
      const amountField = screen.getByLabelText(/kwota/i);
      const dateField = screen.getByLabelText(/data/i);

      expect(nameField).toHaveAttribute("aria-invalid", "false");
      expect(amountField).toHaveAttribute("aria-invalid", "false");
      expect(dateField).toHaveAttribute("aria-invalid", "false");
    });
  });

  describe("Edge Cases", () => {
    it("should handle very large amounts", async () => {
      const user = userEvent.setup();

      render(<ExpenseFormModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);

      await user.type(screen.getByLabelText(/nazwa/i), "Large Expense");
      await user.type(screen.getByLabelText(/kwota/i), "999999999.99");

      await user.click(screen.getByRole("button", { name: /zapisz/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          name: "Large Expense",
          amount: 999999999.99,
          date: expect.any(String),
          description: undefined,
        });
      });
    });

    it("should handle very long expense names", async () => {
      const user = userEvent.setup();
      const longName = faker.lorem.words(50); // Very long name

      render(<ExpenseFormModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);

      // Use paste for long text - faster and more realistic
      await user.click(screen.getByLabelText(/nazwa/i));
      await user.paste(longName);
      await user.type(screen.getByLabelText(/kwota/i), "100");

      await user.click(screen.getByRole("button", { name: /zapisz/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          name: longName,
          amount: 100,
          date: expect.any(String),
          description: undefined,
        });
      });
    });

    it("should handle very long descriptions", async () => {
      const user = userEvent.setup();
      const longDescription = faker.lorem.sentences(20); // Very long description

      render(<ExpenseFormModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);

      await user.type(screen.getByLabelText(/nazwa/i), "Test");
      await user.type(screen.getByLabelText(/kwota/i), "100");
      // Use paste for long text - faster and more realistic
      await user.click(screen.getByLabelText(/opis/i));
      await user.paste(longDescription);

      await user.click(screen.getByRole("button", { name: /zapisz/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          name: "Test",
          amount: 100,
          date: expect.any(String),
          description: longDescription,
        });
      });
    });
  });
});

import { renderHook, act, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { faker } from "@faker-js/faker";
import { useExpenses } from "./useExpenses";
import type { PaginatedExpensesDto, ExpenseDto, CreateExpenseCommand, UpdateExpenseCommand } from "@/types";
import type { FilterState, SortState } from "../types";
import { server } from "@/test/mocks/server";

// Mock fetch globally - this will override MSW for these specific tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useExpenses", () => {
  // Test data generators using faker
  const generateMockExpense = (): ExpenseDto => ({
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    amount: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
    date: faker.date.recent().toISOString().split("T")[0],
    description: faker.lorem.sentence(),
    created_at: faker.date.recent().toISOString(),
  });

  const generateMockExpenses = (count: number): ExpenseDto[] => Array.from({ length: count }, generateMockExpense);

  const generateMockPaginatedResponse = (
    expenses: ExpenseDto[] = generateMockExpenses(5),
    page = 1,
    limit = 10
  ): PaginatedExpensesDto => ({
    data: expenses,
    pagination: {
      page,
      limit,
      total_items: expenses.length,
      total_pages: Math.ceil(expenses.length / limit),
    },
  });

  const generateCreateCommand = (): CreateExpenseCommand => ({
    name: faker.commerce.productName(),
    amount: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
    date: faker.date.recent().toISOString().split("T")[0],
    description: faker.lorem.sentence(),
  });

  const generateUpdateCommand = (): UpdateExpenseCommand => ({
    name: faker.commerce.productName(),
    amount: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
    date: faker.date.recent().toISOString().split("T")[0],
    description: faker.lorem.sentence(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Stop MSW server to prevent interference with our fetch mocks
    server.close();
  });

  afterEach(() => {
    vi.resetAllMocks();
    // Restart MSW server for other tests
    server.listen({ onUnhandledRequest: "error" });
  });

  describe("Initial State", () => {
    it("should initialize with correct default values", async () => {
      // Mock a successful response for the initial fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(generateMockPaginatedResponse()),
      });

      const { result } = renderHook(() => useExpenses());

      // Initially, loading should be true because useEffect triggers fetchExpenses
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeNull();
      expect(result.current.filters).toEqual({
        startDate: null,
        endDate: null,
      });
      expect(result.current.sort).toEqual({
        sortBy: "date",
        order: "desc",
      });
      expect(result.current.page).toBe(1);
      expect(result.current.error).toBeNull();

      // Wait for the initial fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // After fetch completes, data should be populated
      expect(result.current.data).not.toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe("fetchExpenses", () => {
    it("should fetch expenses successfully with default parameters", async () => {
      const mockResponse = generateMockPaginatedResponse();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHook(() => useExpenses());

      // Wait for initial fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/expenses?page=1&limit=10&sort_by=date&order=desc");
      expect(result.current.data).toEqual(mockResponse);
      expect(result.current.error).toBeNull();
    });

    it("should include filters in query parameters when set", async () => {
      const mockResponse = generateMockPaginatedResponse();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHook(() => useExpenses());

      const testFilters: FilterState = {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      };

      await act(async () => {
        result.current.setFilters(testFilters);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          "/api/expenses?page=1&limit=10&sort_by=date&order=desc&start_date=2024-01-01&end_date=2024-01-31"
        );
      });
    });

    it("should handle fetch errors correctly", async () => {
      const errorMessage = "Failed to fetch expenses: Internal Server Error";
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Internal Server Error",
      });

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.error).toEqual(new Error(errorMessage));
        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toBeNull();
      });
    });

    it("should handle network errors", async () => {
      const networkError = new Error("Network error");
      mockFetch.mockRejectedValueOnce(networkError);

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.error).toEqual(networkError);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should set loading state correctly during fetch", async () => {
      const mockResponse = generateMockPaginatedResponse();
      let resolvePromise: ((value: Response) => void) | undefined;
      const fetchPromise = new Promise<Response>((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(fetchPromise);

      const { result } = renderHook(() => useExpenses());

      // Initially loading should be true
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      act(() => {
        if (resolvePromise) {
          resolvePromise({
            ok: true,
            json: vi.fn().mockResolvedValue(mockResponse),
          } as Response);
        }
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("addExpense", () => {
    it("should add expense successfully and refresh data", async () => {
      const newExpense = generateMockExpense();
      const createCommand = generateCreateCommand();
      const mockResponse = generateMockPaginatedResponse();

      // Mock successful POST request
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(newExpense),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockResponse),
        });

      const { result } = renderHook(() => useExpenses());

      // Wait for initial fetch
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let addedExpense: ExpenseDto | undefined;
      await act(async () => {
        addedExpense = await result.current.addExpense(createCommand);
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createCommand),
      });
      expect(addedExpense).toEqual(newExpense);
      // Should have called fetch again to refresh data
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("should handle add expense errors", async () => {
      const createCommand = generateCreateCommand();
      const errorResponse = { message: "Validation failed" };

      // Mock initial fetch
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(generateMockPaginatedResponse()),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: vi.fn().mockResolvedValue(errorResponse),
        });

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.addExpense(createCommand);
        })
      ).rejects.toThrow("Validation failed");
    });
  });

  describe("updateExpense", () => {
    it("should update expense successfully and refresh data", async () => {
      const expenseId = faker.string.uuid();
      const updateCommand = generateUpdateCommand();
      const updatedExpense = generateMockExpense();
      const mockResponse = generateMockPaginatedResponse();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(updatedExpense),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockResponse),
        });

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let resultExpense: ExpenseDto | undefined;
      await act(async () => {
        resultExpense = await result.current.updateExpense(expenseId, updateCommand);
      });

      expect(mockFetch).toHaveBeenCalledWith(`/api/expenses/${expenseId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateCommand),
      });
      expect(resultExpense).toEqual(updatedExpense);
    });

    it("should handle update expense errors", async () => {
      const expenseId = faker.string.uuid();
      const updateCommand = generateUpdateCommand();
      const errorResponse = { message: "Expense not found" };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(generateMockPaginatedResponse()),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: vi.fn().mockResolvedValue(errorResponse),
        });

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.updateExpense(expenseId, updateCommand);
        })
      ).rejects.toThrow("Expense not found");
    });
  });

  describe("deleteExpense", () => {
    it("should delete expense with optimistic update", async () => {
      const expenses = generateMockExpenses(3);
      const expenseToDelete = expenses[1];
      const mockResponse = generateMockPaginatedResponse(expenses);
      const updatedResponse = generateMockPaginatedResponse(expenses.filter((e) => e.id !== expenseToDelete.id));

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(updatedResponse),
        });

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.data).toEqual(mockResponse);
      });

      await act(async () => {
        await result.current.deleteExpense(expenseToDelete.id);
      });

      expect(mockFetch).toHaveBeenCalledWith(`/api/expenses/${expenseToDelete.id}`, {
        method: "DELETE",
      });
      expect(result.current.data).toEqual(updatedResponse);
    });

    it("should revert optimistic update on delete error", async () => {
      const expenses = generateMockExpenses(3);
      const expenseToDelete = expenses[1];
      const mockResponse = generateMockPaginatedResponse(expenses);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue(mockResponse),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: vi.fn().mockResolvedValue({ message: "Delete failed" }),
        });

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.data).toEqual(mockResponse);
      });

      await expect(
        act(async () => {
          await result.current.deleteExpense(expenseToDelete.id);
        })
      ).rejects.toThrow("Delete failed");

      // Should revert to original data
      expect(result.current.data).toEqual(mockResponse);
    });

    it("should handle delete when data is null", async () => {
      const expenseId = faker.string.uuid();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Not Found",
      });

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.data).toBeNull();
      });

      // Reset mocks to test delete call
      vi.clearAllMocks();
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      await act(async () => {
        await result.current.deleteExpense(expenseId);
      });

      expect(mockFetch).toHaveBeenCalledWith(`/api/expenses/${expenseId}`, {
        method: "DELETE",
      });
    });
  });

  describe("Filter Management", () => {
    it("should update filters and reset page to 1", async () => {
      const mockResponse = generateMockPaginatedResponse();
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHook(() => useExpenses());

      // Set page to something other than 1
      await act(async () => {
        result.current.setPage(3);
      });

      const newFilters: FilterState = {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      };

      await act(async () => {
        result.current.setFilters(newFilters);
      });

      expect(result.current.filters).toEqual(newFilters);
      expect(result.current.page).toBe(1);
    });
  });

  describe("Sort Management", () => {
    it("should update sort and reset page to 1", async () => {
      const mockResponse = generateMockPaginatedResponse();
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHook(() => useExpenses());

      // Set page to something other than 1
      await act(async () => {
        result.current.setPage(2);
      });

      const newSort: SortState = {
        sortBy: "amount",
        order: "asc",
      };

      await act(async () => {
        result.current.setSort(newSort);
      });

      expect(result.current.sort).toEqual(newSort);
      expect(result.current.page).toBe(1);
    });
  });

  describe("Page Management", () => {
    it("should update page correctly", async () => {
      const mockResponse = generateMockPaginatedResponse();
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHook(() => useExpenses());

      await act(async () => {
        result.current.setPage(5);
      });

      expect(result.current.page).toBe(5);
    });
  });

  describe("Refetch", () => {
    it("should refetch data when refetch is called", async () => {
      const mockResponse = generateMockPaginatedResponse();
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Clear previous calls
      vi.clearAllMocks();

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith("/api/expenses?page=1&limit=10&sort_by=date&order=desc");
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle complex filter and sort combinations", async () => {
      const mockResponse = generateMockPaginatedResponse();
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHook(() => useExpenses());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Apply filters and sort
      await act(async () => {
        result.current.setFilters({
          startDate: "2024-01-01",
          endDate: "2024-12-31",
        });
      });

      await act(async () => {
        result.current.setSort({
          sortBy: "amount",
          order: "asc",
        });
      });

      await act(async () => {
        result.current.setPage(2);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          "/api/expenses?page=2&limit=10&sort_by=amount&order=asc&start_date=2024-01-01&end_date=2024-12-31"
        );
      });
    });

    it("should handle rapid state changes correctly", async () => {
      const mockResponse = generateMockPaginatedResponse();
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      const { result } = renderHook(() => useExpenses());

      // Rapid state changes
      await act(async () => {
        result.current.setPage(2);
        result.current.setSort({ sortBy: "amount", order: "asc" });
        result.current.setFilters({ startDate: "2024-01-01", endDate: null });
      });

      // Should reset page to 1 due to sort and filter changes
      expect(result.current.page).toBe(1);
      expect(result.current.sort).toEqual({ sortBy: "amount", order: "asc" });
      expect(result.current.filters).toEqual({ startDate: "2024-01-01", endDate: null });
    });
  });
});

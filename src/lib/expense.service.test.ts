import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockExpense } from "@/test/utils";
import * as expenseService from "./expense.service";
import type { SupabaseClient } from "@/db/supabase.client";

// Create mock query builder
const createMockQueryBuilder = () => ({
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lt: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  match: vi.fn().mockReturnThis(),
  single: vi.fn(),
});

// Mock the Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => createMockQueryBuilder()),
};

vi.mock("@/db/supabase.client", () => ({
  supabase: mockSupabaseClient,
}));

describe("ExpenseService", () => {
  let mockQueryBuilder: ReturnType<typeof createMockQueryBuilder>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryBuilder = createMockQueryBuilder();
    mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
  });

  describe("getPaginatedExpenses", () => {
    it("should fetch expenses with default pagination", async () => {
      const mockExpenses = [createMockExpense(), createMockExpense()];

      // Mock the final query result
      mockQueryBuilder.single = vi.fn();
      mockQueryBuilder.range.mockReturnValue({
        data: mockExpenses,
        error: null,
        count: 2,
      });

      const options = {
        page: 1,
        limit: 10,
        sort_by: "date" as const,
        order: "desc" as const,
      };

      const result = await expenseService.getPaginatedExpenses(
        mockSupabaseClient as unknown as SupabaseClient,
        "user-id",
        options
      );

      expect(mockSupabaseClient.from).toHaveBeenCalledWith("expenses");
      expect(result.data).toBeDefined();
      expect(result.pagination.total_items).toBe(2);
    });

    it("should handle errors when fetching expenses", async () => {
      const mockError = new Error("Database error");

      // Mock the query to throw an error
      mockQueryBuilder.range.mockReturnValue({
        data: null,
        error: mockError,
        count: null,
      });

      const options = {
        page: 1,
        limit: 10,
        sort_by: "date" as const,
        order: "desc" as const,
      };

      await expect(
        expenseService.getPaginatedExpenses(mockSupabaseClient as unknown as SupabaseClient, "user-id", options)
      ).rejects.toThrow("Failed to retrieve expenses");
    });
  });

  describe("createExpense", () => {
    it("should create a new expense", async () => {
      const newExpense = {
        amount: 100,
        name: "Test expense",
        date: "2023-10-15",
        description: "Test description",
      };

      const createdExpense = createMockExpense(newExpense);

      // Mock the insert chain
      mockQueryBuilder.single.mockResolvedValue({
        data: createdExpense,
        error: null,
      });

      const result = await expenseService.createExpense(
        mockSupabaseClient as unknown as SupabaseClient,
        "user-id",
        newExpense
      );

      expect(result).toEqual(createdExpense);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("expenses");
    });

    it("should handle creation errors", async () => {
      const newExpense = {
        amount: 100,
        name: "Test expense",
        date: "2023-10-15",
        description: "Test description",
      };

      const mockError = new Error("Database error");

      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(
        expenseService.createExpense(mockSupabaseClient as unknown as SupabaseClient, "user-id", newExpense)
      ).rejects.toThrow("Failed to create expense");
    });
  });

  describe("updateExpense", () => {
    it("should update an existing expense", async () => {
      const expenseId = "test-id";
      const updates = { amount: 150, description: "Updated expense" };
      const updatedExpense = createMockExpense({ id: expenseId, ...updates });

      mockQueryBuilder.single.mockResolvedValue({
        data: updatedExpense,
        error: null,
      });

      const result = await expenseService.updateExpense(
        mockSupabaseClient as unknown as SupabaseClient,
        expenseId,
        "user-id",
        updates
      );

      expect(result).toEqual(updatedExpense);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("expenses");
    });

    it("should return null when expense not found", async () => {
      const expenseId = "test-id";
      const updates = { amount: 150 };

      const mockError = { code: "PGRST116" };
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await expenseService.updateExpense(
        mockSupabaseClient as unknown as SupabaseClient,
        expenseId,
        "user-id",
        updates
      );

      expect(result).toBeNull();
    });
  });

  describe("deleteExpense", () => {
    it("should delete an expense", async () => {
      // Mock the delete chain properly
      mockQueryBuilder.delete.mockReturnValue({
        match: vi.fn().mockResolvedValue({
          data: null,
          error: null,
          count: 1,
        }),
      });

      const result = await expenseService.deleteExpense(
        mockSupabaseClient as unknown as SupabaseClient,
        "test-id",
        "user-id"
      );

      expect(result).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("expenses");
    });

    it("should return null when expense not found", async () => {
      // Mock the delete chain properly
      mockQueryBuilder.delete.mockReturnValue({
        match: vi.fn().mockResolvedValue({
          data: null,
          error: null,
          count: 0,
        }),
      });

      const result = await expenseService.deleteExpense(
        mockSupabaseClient as unknown as SupabaseClient,
        "test-id",
        "user-id"
      );

      expect(result).toBeNull();
    });
  });

  describe("getExpenseById", () => {
    it("should get expense by id", async () => {
      const mockExpense = createMockExpense({ id: "test-id" });

      mockQueryBuilder.single.mockResolvedValue({
        data: mockExpense,
        error: null,
      });

      const result = await expenseService.getExpenseById(
        mockSupabaseClient as unknown as SupabaseClient,
        "test-id",
        "user-id"
      );

      expect(result).toEqual(mockExpense);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("expenses");
    });

    it("should return null when expense not found", async () => {
      const mockError = { code: "PGRST116" };
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await expenseService.getExpenseById(
        mockSupabaseClient as unknown as SupabaseClient,
        "test-id",
        "user-id"
      );

      expect(result).toBeNull();
    });
  });
});

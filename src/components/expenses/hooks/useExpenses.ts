import { useState, useEffect, useCallback } from 'react';
import type {
  PaginatedExpensesDto,
  ExpenseDto,
  CreateExpenseCommand,
  UpdateExpenseCommand,
} from '@/types';
import type { FilterState, SortState } from '../types';

/**
 * Custom hook for managing expenses state and API interactions.
 * Abstracts business logic from UI components for better testability and readability.
 */
export const useExpenses = () => {
  // State management
  const [data, setData] = useState<PaginatedExpensesDto | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    startDate: null,
    endDate: null,
  });
  const [sort, setSort] = useState<SortState>({
    sortBy: 'date',
    order: 'desc',
  });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetches expenses from the API based on current filters, sort, and pagination.
   */
  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sort_by: sort.sortBy,
        order: sort.order,
      });

      if (filters.startDate) {
        params.append('start_date', filters.startDate);
      }
      if (filters.endDate) {
        params.append('end_date', filters.endDate);
      }

      const response = await fetch(`/api/expenses?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch expenses: ${response.statusText}`);
      }

      const result: PaginatedExpensesDto = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, [page, sort, filters]);

  /**
   * Fetches expenses whenever dependencies change.
   */
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  /**
   * Adds a new expense via API.
   */
  const addExpense = useCallback(
    async (command: CreateExpenseCommand): Promise<ExpenseDto> => {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create expense');
      }

      const newExpense: ExpenseDto = await response.json();

      // Refresh the list after adding
      await fetchExpenses();

      return newExpense;
    },
    [fetchExpenses]
  );

  /**
   * Updates an existing expense via API.
   */
  const updateExpense = useCallback(
    async (id: string, command: UpdateExpenseCommand): Promise<ExpenseDto> => {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update expense');
      }

      const updatedExpense: ExpenseDto = await response.json();

      // Refresh the list after updating
      await fetchExpenses();

      return updatedExpense;
    },
    [fetchExpenses]
  );

  /**
   * Deletes an expense via API.
   * Implements optimistic UI update.
   */
  const deleteExpense = useCallback(
    async (id: string): Promise<void> => {
      // Optimistic update: remove from UI immediately
      const previousData = data;
      if (data) {
        setData({
          ...data,
          data: data.data.filter((expense) => expense.id !== id),
        });
      }

      try {
        const response = await fetch(`/api/expenses/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          // Revert optimistic update on error
          setData(previousData);
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to delete expense');
        }

        // Refresh the list to get accurate pagination
        await fetchExpenses();
      } catch (err) {
        // Revert optimistic update on error
        setData(previousData);
        throw err;
      }
    },
    [data, fetchExpenses]
  );

  /**
   * Updates filter state and resets to first page.
   */
  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  }, []);

  /**
   * Updates sort state and resets to first page.
   */
  const handleSortChange = useCallback((newSort: SortState) => {
    setSort(newSort);
    setPage(1); // Reset to first page when sort changes
  }, []);

  return {
    // State
    data,
    filters,
    sort,
    page,
    isLoading,
    error,
    // Actions
    setFilters: handleFilterChange,
    setSort: handleSortChange,
    setPage,
    addExpense,
    updateExpense,
    deleteExpense,
    refetch: fetchExpenses,
  };
};


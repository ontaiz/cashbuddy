/**
 * Local types for managing UI state in the expenses view.
 * These complement the DTOs defined in src/types.ts
 */

/**
 * State for filtering expenses by date range.
 */
export interface FilterState {
  startDate: string | null;
  endDate: string | null;
}

/**
 * State for sorting expenses.
 */
export interface SortState {
  sortBy: "date" | "amount";
  order: "asc" | "desc";
}

import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

/**
 * Represents a single expense record as returned by the API.
 * The `user_id` is omitted for security reasons, as it should not be exposed to the client.
 */
export type ExpenseDto = Omit<Tables<"expenses">, "user_id">;

/**
 * Defines the structure for pagination information provided in list responses.
 */
export interface Pagination {
	page: number;
	limit: number;
	total_items: number;
	total_pages: number;
}

/**
 * Represents the response for a paginated list of expenses.
 */
export interface PaginatedExpensesDto {
	data: ExpenseDto[];
	pagination: Pagination;
}

/**
 * Command model for creating a new expense.
 * It includes only the fields that are expected from the client.
 * Server-managed fields like `id`, `user_id`, and `created_at` are excluded.
 */
export type CreateExpenseCommand = Pick<
	TablesInsert<"expenses">,
	"amount" | "name" | "date" | "description"
>;

/**
 * Command model for updating an existing expense.
 * All fields are optional, allowing for partial updates (PATCH).
 * Excludes fields that should not be updated by the client.
 */
export type UpdateExpenseCommand = Omit<
	TablesUpdate<"expenses">,
	"id" | "user_id" | "created_at"
>;

/**
 * Represents a top expense item in the dashboard summary.
 * This is a subset of the full ExpenseDto.
 */
export type TopExpenseDto = Pick<
	Tables<"expenses">,
	"id" | "name" | "amount" | "date"
>;

/**
 * Represents the summary of total expenses for a specific month.
 */
export interface MonthlySummaryDto {
	month: string; // Format: "YYYY-MM"
	total: number;
}

/**
 * Represents the aggregated data structure for the main dashboard view.
 */
export interface DashboardDataDto {
	total_expenses: number;
	current_month_expenses: number;
	top_5_expenses: TopExpenseDto[];
	monthly_summary: MonthlySummaryDto[];
}

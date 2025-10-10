import type { SupabaseClient } from '../db/supabase.client';
import type { DashboardDataDto, TopExpenseDto, MonthlySummaryDto } from '../types';

/**
 * Error class for dashboard service operations
 */
export class DashboardServiceError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly details?: unknown
	) {
		super(message);
		this.name = 'DashboardServiceError';
	}
}

/**
 * Retrieves aggregated dashboard data for a specific user.
 * 
 * This function executes 4 parallel database queries to fetch:
 * 1. Total expenses across all time
 * 2. Current month expenses
 * 3. Top 5 highest expenses
 * 4. Monthly summary for the last 12 months
 * 
 * SECURITY NOTE: All queries MUST filter by user_id since RLS is disabled.
 * 
 * @param supabase - Supabase client instance
 * @param userId - ID of the authenticated user
 * @returns Aggregated dashboard data
 * @throws {DashboardServiceError} When any database operation fails
 */
export async function getDashboardData(
	supabase: SupabaseClient,
	userId: string
): Promise<DashboardDataDto> {
	// Get current month boundaries
	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth(); // 0-indexed
	const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
	const startOfNextMonth = new Date(currentYear, currentMonth + 1, 1).toISOString().split('T')[0];

	// Execute all 4 queries in parallel using Promise.all
	const [
		totalExpensesResult,
		currentMonthExpensesResult,
		topExpensesResult,
		monthlySummaryResult
	] = await Promise.all([
		// Query 1: Total expenses across all time
		supabase
			.from('expenses')
			.select('amount')
			.eq('user_id', userId),

		// Query 2: Current month expenses
		supabase
			.from('expenses')
			.select('amount')
			.eq('user_id', userId)
			.gte('date', startOfMonth)
			.lt('date', startOfNextMonth),

		// Query 3: Top 5 expenses ordered by amount descending
		supabase
			.from('expenses')
			.select('id, name, amount, date')
			.eq('user_id', userId)
			.order('amount', { ascending: false })
			.limit(5),

		// Query 4: Monthly summary for the last 12 months
		// We'll fetch all expenses and aggregate in-app since Supabase doesn't support GROUP BY directly
		supabase
			.from('expenses')
			.select('amount, date')
			.eq('user_id', userId)
			.order('date', { ascending: false })
	]);

	// Handle errors from parallel queries
	if (totalExpensesResult.error) {
		throw new DashboardServiceError(
			'Failed to retrieve total expenses',
			'DATABASE_ERROR',
			totalExpensesResult.error
		);
	}

	if (currentMonthExpensesResult.error) {
		throw new DashboardServiceError(
			'Failed to retrieve current month expenses',
			'DATABASE_ERROR',
			currentMonthExpensesResult.error
		);
	}

	if (topExpensesResult.error) {
		throw new DashboardServiceError(
			'Failed to retrieve top expenses',
			'DATABASE_ERROR',
			topExpensesResult.error
		);
	}

	if (monthlySummaryResult.error) {
		throw new DashboardServiceError(
			'Failed to retrieve monthly summary data',
			'DATABASE_ERROR',
			monthlySummaryResult.error
		);
	}

	// Calculate total expenses
	const totalExpenses = (totalExpensesResult.data || []).reduce(
		(sum, expense) => sum + (expense.amount || 0),
		0
	);

	// Calculate current month expenses
	const currentMonthExpenses = (currentMonthExpensesResult.data || []).reduce(
		(sum, expense) => sum + (expense.amount || 0),
		0
	);

	// Map top expenses to DTO format
	const topExpenses: TopExpenseDto[] = (topExpensesResult.data || []).map(expense => ({
		id: expense.id,
		name: expense.name,
		amount: expense.amount,
		date: expense.date
	}));

	// Aggregate monthly summary (last 12 months)
	const monthlyMap = new Map<string, number>();
	const twelveMonthsAgo = new Date(currentYear, currentMonth - 11, 1);

	(monthlySummaryResult.data || []).forEach(expense => {
		const expenseDate = new Date(expense.date);
		
		// Only include expenses from the last 12 months
		if (expenseDate >= twelveMonthsAgo) {
			const monthKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
			const currentTotal = monthlyMap.get(monthKey) || 0;
			monthlyMap.set(monthKey, currentTotal + (expense.amount || 0));
		}
	});

	// Convert monthly map to array and sort by month
	const monthlySummary: MonthlySummaryDto[] = Array.from(monthlyMap.entries())
		.map(([month, total]) => ({ month, total }))
		.sort((a, b) => a.month.localeCompare(b.month));

	// Return aggregated dashboard data
	return {
		total_expenses: totalExpenses,
		current_month_expenses: currentMonthExpenses,
		top_5_expenses: topExpenses,
		monthly_summary: monthlySummary
	};
}


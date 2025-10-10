import type { SupabaseClient } from '../db/supabase.client';
import type { Tables } from '../db/database.types';
import type { CreateExpenseCommand, UpdateExpenseCommand, PaginatedExpensesDto, ExpenseDto } from '../types';
import type { GetExpensesInput, UpdateExpenseInput } from './expense.validation';

/**
 * Error class for expense service operations
 */
export class ExpenseServiceError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly details?: unknown
	) {
		super(message);
		this.name = 'ExpenseServiceError';
	}
}

/**
 * Creates a new expense record in the database.
 * 
 * @param supabase - Supabase client instance
 * @param userId - ID of the authenticated user
 * @param data - Validated expense data
 * @returns Newly created expense record
 * @throws {ExpenseServiceError} When database operation fails
 */
export async function createExpense(
	supabase: SupabaseClient,
	userId: string,
	data: CreateExpenseCommand
): Promise<Tables<'expenses'>> {
	// Prepare the insert data with user_id
	const insertData = {
		user_id: userId,
		amount: data.amount,
		name: data.name,
		date: data.date,
		description: data.description ?? null,
	};

	// Insert the expense into the database
	const { data: expense, error } = await supabase
		.from('expenses')
		.insert(insertData)
		.select()
		.single();

	// Handle database errors
	if (error) {
		throw new ExpenseServiceError(
			'Failed to create expense',
			'DATABASE_ERROR',
			error
		);
	}

	// Handle case where no data is returned (shouldn't happen with .single())
	if (!expense) {
		throw new ExpenseServiceError(
			'No expense data returned after insert',
			'NO_DATA_RETURNED'
		);
	}

	return expense;
}

/**
 * Retrieves a paginated list of expenses for a user with optional filtering and sorting.
 * 
 * @param supabase - Supabase client instance
 * @param userId - ID of the authenticated user
 * @param options - Query options for pagination, sorting, and filtering
 * @returns Paginated list of expenses with metadata
 * @throws {ExpenseServiceError} When database operation fails
 */
export async function getPaginatedExpenses(
	supabase: SupabaseClient,
	userId: string,
	options: GetExpensesInput
): Promise<PaginatedExpensesDto> {
	const { page, limit, sort_by, order, start_date, end_date } = options;

	// Build the base query - filter by user_id
	let query = supabase
		.from('expenses')
		.select('*', { count: 'exact' })
		.eq('user_id', userId);

	// Apply date range filters if provided
	if (start_date) {
		query = query.gte('date', start_date);
	}
	if (end_date) {
		// Add one day to end_date to make it inclusive
		const endDateTime = new Date(end_date);
		endDateTime.setDate(endDateTime.getDate() + 1);
		query = query.lt('date', endDateTime.toISOString().split('T')[0]);
	}

	// Apply sorting
	const ascending = order === 'asc';
	query = query.order(sort_by, { ascending });

	// Calculate pagination range
	const from = (page - 1) * limit;
	const to = from + limit - 1;
	query = query.range(from, to);

	// Execute the query
	const { data, error, count } = await query;

	// Handle database errors
	if (error) {
		throw new ExpenseServiceError(
			'Failed to retrieve expenses',
			'DATABASE_ERROR',
			error
		);
	}

	// Handle case where no data is returned
	if (!data) {
		throw new ExpenseServiceError(
			'No expenses data returned',
			'NO_DATA_RETURNED'
		);
	}

	// Calculate total pages
	const totalItems = count ?? 0;
	const totalPages = Math.ceil(totalItems / limit);

	// Transform data to ExpenseDto (omit user_id)
	const expenses: ExpenseDto[] = data.map(({ user_id, ...expense }) => expense);

	// Return paginated response
	return {
		data: expenses,
		pagination: {
			page,
			limit,
			total_items: totalItems,
			total_pages: totalPages,
		},
	};
}

/**
 * Retrieves a single expense by ID for a specific user.
 * 
 * @param supabase - Supabase client instance
 * @param id - Expense ID (UUID)
 * @param userId - ID of the authenticated user
 * @returns Expense record if found, null if not found
 * @throws {ExpenseServiceError} When database operation fails
 */
export async function getExpenseById(
	supabase: SupabaseClient,
	id: string,
	userId: string
): Promise<Tables<'expenses'> | null> {
	// Query the database for the expense with matching id and user_id
	const { data, error } = await supabase
		.from('expenses')
		.select('*')
		.eq('id', id)
		.eq('user_id', userId)
		.single();

	// Handle database errors
	if (error) {
		// Check if it's a "not found" error (PGRST116)
		if (error.code === 'PGRST116') {
			return null;
		}

		// Other database errors
		throw new ExpenseServiceError(
			'Failed to retrieve expense',
			'DATABASE_ERROR',
			error
		);
	}

	return data;
}

/**
 * Updates an existing expense record in the database.
 * 
 * @param supabase - Supabase client instance
 * @param id - Expense ID (UUID)
 * @param userId - ID of the authenticated user
 * @param data - Validated expense data to update
 * @returns Updated expense record if found and updated, null if not found
 * @throws {ExpenseServiceError} When database operation fails
 */
export async function updateExpense(
	supabase: SupabaseClient,
	id: string,
	userId: string,
	data: UpdateExpenseInput
): Promise<Tables<'expenses'> | null> {
	// Prepare the update data - only include fields that are provided
	const updateData: Partial<UpdateExpenseCommand> = {};
	
	if (data.amount !== undefined) {
		updateData.amount = data.amount;
	}
	if (data.name !== undefined) {
		updateData.name = data.name;
	}
	if (data.date !== undefined) {
		updateData.date = data.date;
	}
	if (data.description !== undefined) {
		updateData.description = data.description;
	}

	// Update the expense in the database with user_id check
	const { data: expense, error } = await supabase
		.from('expenses')
		.update(updateData)
		.eq('id', id)
		.eq('user_id', userId)
		.select()
		.single();

	// Handle database errors
	if (error) {
		// Check if it's a "not found" error (PGRST116)
		if (error.code === 'PGRST116') {
			return null;
		}

		// Other database errors
		throw new ExpenseServiceError(
			'Failed to update expense',
			'DATABASE_ERROR',
			error
		);
	}

	// If no data returned, the expense was not found or doesn't belong to the user
	if (!expense) {
		return null;
	}

	return expense;
}

/**
 * Deletes an expense record from the database.
 * 
 * @param supabase - Supabase client instance
 * @param expenseId - Expense ID (UUID) to delete
 * @param userId - ID of the authenticated user
 * @returns True if expense was deleted, null if not found
 * @throws {ExpenseServiceError} When database operation fails
 */
export async function deleteExpense(
	supabase: SupabaseClient,
	expenseId: string,
	userId: string
): Promise<boolean | null> {
	// Delete the expense from the database with user_id check for security
	const { error, count } = await supabase
		.from('expenses')
		.delete({ count: 'exact' })
		.match({ id: expenseId, user_id: userId });

	// Handle database errors
	if (error) {
		throw new ExpenseServiceError(
			'Failed to delete expense',
			'DATABASE_ERROR',
			error
		);
	}

	// If count is 0, the expense was not found or doesn't belong to the user
	if (count === 0) {
		return null;
	}

	return true;
}


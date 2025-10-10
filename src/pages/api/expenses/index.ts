import type { APIRoute } from 'astro';
import { z } from 'zod';

import { DEFAULT_USER_ID } from '../../../db/supabase.client';
import { createExpenseSchema, getExpensesSchema } from '../../../lib/expense.validation';
import { createExpense, getPaginatedExpenses, ExpenseServiceError } from '../../../lib/expense.service';

// Ensure this endpoint is rendered on-demand on the server
export const prerender = false;

/**
 * POST /api/expenses
 * Creates a new expense record for the user
 */
export const POST: APIRoute = async (context) => {
	try {
		// Get Supabase client from context.locals (injected by middleware)
		const supabase = context.locals.supabase;

		// Parse request body
		let requestBody: unknown;
		try {
			requestBody = await context.request.json();
		} catch (error) {
			return new Response(
				JSON.stringify({
					error: 'Invalid JSON in request body',
				}),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				}
			);
		}

		// Validate request data using Zod schema
		const validationResult = createExpenseSchema.safeParse(requestBody);

		if (!validationResult.success) {
			const errors = validationResult.error.errors.map((err) => ({
				field: err.path.join('.'),
				message: err.message,
			}));

			return new Response(
				JSON.stringify({
					error: 'Validation failed',
					details: errors,
				}),
				{
					status: 422,
					headers: { 'Content-Type': 'application/json' },
				}
			);
		}

	// Use DEFAULT_USER_ID for the expense
	const userId = DEFAULT_USER_ID;

	// Call service to create expense
	const newExpense = await createExpense(
		supabase,
		userId,
		validationResult.data
	);

		console.log('New expense:', newExpense);

		// Return success response with created expense
		return new Response(JSON.stringify(newExpense), {
			status: 201,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		// Handle service-specific errors
		if (error instanceof ExpenseServiceError) {
			console.error('Expense service error:', error.message, error.details);

			return new Response(
				JSON.stringify({
					error: 'Failed to create expense',
					message: error.message,
				}),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				}
			);
		}

		// Handle unexpected errors
		console.error('Unexpected error in POST /api/expenses:', error);

		return new Response(
			JSON.stringify({
				error: 'Internal server error',
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}
};

/**
 * GET /api/expenses
 * Retrieves a paginated list of expenses for the user with optional filtering and sorting
 */
export const GET: APIRoute = async (context) => {
	try {
		// Get Supabase client from context.locals (injected by middleware)
		const supabase = context.locals.supabase;

		// Extract query parameters from URL
		const url = new URL(context.request.url);
		const queryParams = {
			page: url.searchParams.get('page') ?? undefined,
			limit: url.searchParams.get('limit') ?? undefined,
			sort_by: url.searchParams.get('sort_by') ?? undefined,
			order: url.searchParams.get('order') ?? undefined,
			start_date: url.searchParams.get('start_date') ?? undefined,
			end_date: url.searchParams.get('end_date') ?? undefined,
		};

		// Validate query parameters using Zod schema
		const validationResult = getExpensesSchema.safeParse(queryParams);

		if (!validationResult.success) {
			const errors = validationResult.error.errors.map((err) => ({
				field: err.path.join('.'),
				message: err.message,
			}));

			return new Response(
				JSON.stringify({
					error: 'Validation failed',
					details: errors,
				}),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				}
			);
		}

		// Use DEFAULT_USER_ID for the expense
		const userId = DEFAULT_USER_ID;

		// Call service to get paginated expenses
		const paginatedExpenses = await getPaginatedExpenses(
			supabase,
			userId,
			validationResult.data
		);

		// Return success response with paginated expenses
		return new Response(JSON.stringify(paginatedExpenses), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		// Handle service-specific errors
		if (error instanceof ExpenseServiceError) {
			console.error('Expense service error:', error.message, error.details);

			return new Response(
				JSON.stringify({
					error: 'Failed to retrieve expenses',
					message: error.message,
				}),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				}
			);
		}

		// Handle unexpected errors
		console.error('Unexpected error in GET /api/expenses:', error);

		return new Response(
			JSON.stringify({
				error: 'Internal server error',
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	}
};




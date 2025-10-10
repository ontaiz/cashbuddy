import type { APIRoute } from 'astro';

import { DEFAULT_USER_ID } from '../../../db/supabase.client';
import { getDashboardData, DashboardServiceError } from '../../../lib/dashboard.service';

// Ensure this endpoint is rendered on-demand on the server
export const prerender = false;

/**
 * GET /api/dashboard
 * Retrieves aggregated dashboard data for the authenticated user
 * 
 * Returns:
 * - Total expenses across all time
 * - Current month expenses
 * - Top 5 highest expenses
 * - Monthly summary for the last 12 months
 */
export const GET: APIRoute = async (context) => {
	try {
		// Get Supabase client from context.locals (injected by middleware)
		const supabase = context.locals.supabase;

		// Use DEFAULT_USER_ID for the dashboard data
		// TODO: Replace with actual authenticated user ID when auth is implemented
		const userId = DEFAULT_USER_ID;

		// Call service to get dashboard data
		const dashboardData = await getDashboardData(supabase, userId);

		// Return success response with dashboard data
		return new Response(JSON.stringify(dashboardData), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		// Handle service-specific errors
		if (error instanceof DashboardServiceError) {
			console.error('Dashboard service error:', error.message, error.details);

			return new Response(
				JSON.stringify({
					error: 'Failed to retrieve dashboard data',
					message: error.message,
				}),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' },
				}
			);
		}

		// Handle unexpected errors
		console.error('Unexpected error in GET /api/dashboard:', error);

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



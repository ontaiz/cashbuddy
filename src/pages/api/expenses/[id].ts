import type { APIRoute } from "astro";

import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { expenseIdSchema, updateExpenseSchema } from "../../../lib/expense.validation";
import { getExpenseById, updateExpense, deleteExpense, ExpenseServiceError } from "../../../lib/expense.service";
import type { ExpenseDto } from "../../../types";

// Ensure this endpoint is rendered on-demand on the server
export const prerender = false;

/**
 * GET /api/expenses/{id}
 * Retrieves a single expense by ID for the authenticated user
 */
export const GET: APIRoute = async (context) => {
  try {
    // Get user from context.locals (set by middleware)
    const user = context.locals.user;

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create Supabase client
    const supabase = createSupabaseServerInstance({
      cookies: context.cookies,
      headers: context.request.headers,
    });

    // Extract the expense ID from URL parameters
    const { id } = context.params;

    // Validate the ID parameter exists
    if (!id) {
      return new Response(
        JSON.stringify({
          error: "Expense ID is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate ID format using Zod schema
    const validationResult = expenseIdSchema.safeParse(id);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: "id",
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Use authenticated user's ID
    const userId = user.id;

    // Call service to get the expense by ID
    const expense = await getExpenseById(supabase, validationResult.data, userId);

    // Handle case where expense is not found
    if (!expense) {
      return new Response(
        JSON.stringify({
          error: "Expense not found",
          message: "The requested expense does not exist or you do not have permission to access it",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Transform to ExpenseDto (omit user_id for security)
    const { user_id, ...expenseDto }: { user_id: string } & ExpenseDto = expense;

    // Return success response with the expense
    return new Response(JSON.stringify(expenseDto), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle service-specific errors
    if (error instanceof ExpenseServiceError) {
      console.error("Expense service error:", error.message, error.details);

      return new Response(
        JSON.stringify({
          error: "Failed to retrieve expense",
          message: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle unexpected errors
    console.error("Unexpected error in GET /api/expenses/{id}:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * PATCH /api/expenses/{id}
 * Updates an existing expense for the authenticated user
 */
export const PATCH: APIRoute = async (context) => {
  try {
    // Get user from context.locals (set by middleware)
    const user = context.locals.user;

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create Supabase client
    const supabase = createSupabaseServerInstance({
      cookies: context.cookies,
      headers: context.request.headers,
    });

    // Extract the expense ID from URL parameters
    const { id } = context.params;

    // Validate the ID parameter exists
    if (!id) {
      return new Response(
        JSON.stringify({
          error: "Expense ID is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate ID format using Zod schema
    const idValidationResult = expenseIdSchema.safeParse(id);

    if (!idValidationResult.success) {
      const errors = idValidationResult.error.errors.map((err) => ({
        field: "id",
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = await context.request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON in request body",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate request body using Zod schema
    const bodyValidationResult = updateExpenseSchema.safeParse(requestBody);

    if (!bodyValidationResult.success) {
      const errors = bodyValidationResult.error.errors.map((err) => ({
        field: err.path.join(".") || "unknown",
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: errors,
        }),
        {
          status: 422,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Use authenticated user's ID
    const userId = user.id;

    // Call service to update the expense
    const updatedExpense = await updateExpense(supabase, idValidationResult.data, userId, bodyValidationResult.data);

    // Handle case where expense is not found
    if (!updatedExpense) {
      return new Response(
        JSON.stringify({
          error: "Expense not found",
          message: "The requested expense does not exist or you do not have permission to update it",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Transform to ExpenseDto (omit user_id for security)
    const { user_id, ...expenseDto }: { user_id: string } & ExpenseDto = updatedExpense;

    // Return success response with the updated expense
    return new Response(JSON.stringify(expenseDto), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle service-specific errors
    if (error instanceof ExpenseServiceError) {
      console.error("Expense service error:", error.message, error.details);

      return new Response(
        JSON.stringify({
          error: "Failed to update expense",
          message: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle unexpected errors
    console.error("Unexpected error in PATCH /api/expenses/{id}:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * DELETE /api/expenses/{id}
 * Deletes an existing expense for the authenticated user
 */
export const DELETE: APIRoute = async (context) => {
  try {
    // Get user from context.locals (set by middleware)
    const user = context.locals.user;

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create Supabase client
    const supabase = createSupabaseServerInstance({
      cookies: context.cookies,
      headers: context.request.headers,
    });

    // Extract the expense ID from URL parameters
    const { id } = context.params;

    // Validate the ID parameter exists
    if (!id) {
      return new Response(
        JSON.stringify({
          error: "Expense ID is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate ID format using Zod schema
    const validationResult = expenseIdSchema.safeParse(id);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: "id",
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Use authenticated user's ID
    const userId = user.id;

    // Call service to delete the expense
    const result = await deleteExpense(supabase, validationResult.data, userId);

    // Handle case where expense is not found
    if (result === null) {
      return new Response(
        JSON.stringify({
          error: "Expense not found",
          message: "The requested expense does not exist or you do not have permission to delete it",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return success response with no content
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Handle service-specific errors
    if (error instanceof ExpenseServiceError) {
      console.error("Expense service error:", error.message, error.details);

      return new Response(
        JSON.stringify({
          error: "Failed to delete expense",
          message: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle unexpected errors
    console.error("Unexpected error in DELETE /api/expenses/{id}:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

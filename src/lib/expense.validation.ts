import { z } from "zod";

/**
 * Validation schema for creating a new expense.
 *
 * Validates:
 * - amount: Must be a positive number with max 2 decimal places
 * - name: Required string, 1-100 characters
 * - date: Valid ISO 8601 date string
 * - description: Optional string, max 500 characters
 */
export const createExpenseSchema = z.object({
  amount: z
    .number({
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a number",
    })
    .positive("Amount must be greater than 0")
    .max(999999.99, "Amount must not exceed 999,999.99")
    .refine(
      (val) => {
        // Ensure max 2 decimal places
        const decimalPlaces = (val.toString().split(".")[1] || "").length;
        return decimalPlaces <= 2;
      },
      { message: "Amount must have at most 2 decimal places" }
    ),

  name: z
    .string({
      required_error: "Name is required",
      invalid_type_error: "Name must be a string",
    })
    .min(1, "Name cannot be empty")
    .max(100, "Name must not exceed 100 characters")
    .trim(),

  date: z
    .string({
      required_error: "Date is required",
      invalid_type_error: "Date must be a string",
    })
    .datetime({ message: "Date must be a valid ISO 8601 datetime string" }),

  description: z.string().max(500, "Description must not exceed 500 characters").trim().optional().nullable(),
});

/**
 * Type inference from the validation schema
 */
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

/**
 * Validation schema for GET /api/expenses query parameters.
 *
 * Validates:
 * - page: Optional positive integer, default 1
 * - limit: Optional positive integer (1-100), default 10
 * - sort_by: Optional, either 'date' or 'amount', default 'date'
 * - order: Optional, either 'asc' or 'desc', default 'desc'
 * - start_date: Optional valid date in YYYY-MM-DD format
 * - end_date: Optional valid date in YYYY-MM-DD format
 */
export const getExpensesSchema = z
  .object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .pipe(z.number().int().positive("Page must be a positive integer").default(1)),

    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .pipe(
        z
          .number()
          .int()
          .positive("Limit must be a positive integer")
          .min(1, "Limit must be at least 1")
          .max(100, "Limit must not exceed 100")
          .default(10)
      ),

    sort_by: z
      .enum(["date", "amount"], {
        errorMap: () => ({ message: 'Sort by must be either "date" or "amount"' }),
      })
      .optional()
      .default("date"),

    order: z
      .enum(["asc", "desc"], {
        errorMap: () => ({ message: 'Order must be either "asc" or "desc"' }),
      })
      .optional()
      .default("desc"),

    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format")
      .optional(),

    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
      .optional(),
  })
  .refine(
    (data) => {
      // If both dates are provided, start_date must be before or equal to end_date
      if (data.start_date && data.end_date) {
        return new Date(data.start_date) <= new Date(data.end_date);
      }
      return true;
    },
    {
      message: "Start date must be before or equal to end date",
      path: ["start_date"],
    }
  );

/**
 * Type inference from the get expenses validation schema
 */
export type GetExpensesInput = z.infer<typeof getExpensesSchema>;

/**
 * Validation schema for expense ID parameter.
 * Validates that the ID is a valid UUID format.
 */
export const expenseIdSchema = z.string().uuid({
  message: "Invalid expense ID format. Must be a valid UUID.",
});

/**
 * Type inference from the expense ID validation schema
 */
export type ExpenseIdInput = z.infer<typeof expenseIdSchema>;

/**
 * Validation schema for updating an existing expense.
 *
 * Validates:
 * - amount: Optional positive number with max 2 decimal places
 * - name: Optional string, 1-100 characters
 * - date: Optional valid ISO 8601 date string
 * - description: Optional string, max 500 characters
 *
 * At least one field must be provided for update.
 */
export const updateExpenseSchema = z
  .object({
    amount: z
      .number({
        invalid_type_error: "Amount must be a number",
      })
      .positive("Amount must be greater than 0")
      .max(999999.99, "Amount must not exceed 999,999.99")
      .refine(
        (val) => {
          // Ensure max 2 decimal places
          const decimalPlaces = (val.toString().split(".")[1] || "").length;
          return decimalPlaces <= 2;
        },
        { message: "Amount must have at most 2 decimal places" }
      )
      .optional(),

    name: z
      .string({
        invalid_type_error: "Name must be a string",
      })
      .min(1, "Name cannot be empty")
      .max(100, "Name must not exceed 100 characters")
      .trim()
      .optional(),

    date: z
      .string({
        invalid_type_error: "Date must be a string",
      })
      .datetime({ message: "Date must be a valid ISO 8601 datetime string" })
      .optional(),

    description: z.string().max(500, "Description must not exceed 500 characters").trim().optional().nullable(),
  })
  .refine(
    (data) => {
      // Ensure at least one field is provided for update
      return (
        Object.keys(data).length > 0 &&
        (data.amount !== undefined ||
          data.name !== undefined ||
          data.date !== undefined ||
          data.description !== undefined)
      );
    },
    {
      message: "At least one field must be provided for update",
    }
  );

/**
 * Type inference from the update expense validation schema
 */
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

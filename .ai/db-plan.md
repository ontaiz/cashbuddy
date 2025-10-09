# CashBuddy - Database Schema

## 1. Tables

### `expenses`
Stores information about user expenses.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique identifier for the expense. |
| `user_id` | `uuid` | `NOT NULL`, `FOREIGN KEY REFERENCES auth.users(id) ON DELETE CASCADE` | Foreign key referencing the user who created the expense. |
| `amount` | `numeric(10, 2)` | `NOT NULL`, `CHECK (amount > 0)` | The amount of the expense in PLN. |
| `name` | `text` | `NOT NULL` | The name or title of the expense. |
| `description` | `text` | `NULL` | An optional, more detailed description of the expense. |
| `date` | `timestamptz` | `NOT NULL` | The date and time when the expense was incurred. |
| `created_at` | `timestamptz` | `NOT NULL`, `DEFAULT now()` | The timestamp when the expense record was created. |

## 2. Relationships

- **`auth.users` to `expenses`**: A one-to-many relationship. One user can have multiple expenses, but each expense belongs to exactly one user. This is enforced by the `user_id` foreign key in the `expenses` table.

## 3. Indexes

To optimize query performance for common filtering and sorting operations, the following indexes will be created:

1.  **Index on `(user_id, date DESC)`**:
    -   **Purpose**: Speeds up queries that filter expenses by a user and sort them by date in descending order, which is common for displaying a list of recent transactions.
    -   **SQL**: `CREATE INDEX idx_expenses_user_id_date_desc ON public.expenses (user_id, date DESC);`

2.  **Index on `(user_id, amount DESC)`**:
    -   **Purpose**: Optimizes queries for finding a user's top expenses, such as for the "Top 5 largest expenses" feature on the dashboard.
    -   **SQL**: `CREATE INDEX idx_expenses_user_id_amount_desc ON public.expenses (user_id, amount DESC);`

## 4. Row-Level Security (RLS) Policies

To ensure data isolation and privacy, Row-Level Security (RLS) will be enabled on the `expenses` table. The following policies will be implemented:

1.  **Enable RLS**:
    -   **SQL**: `ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;`

2.  **SELECT Policy**:
    -   **Description**: Allows users to view only their own expenses.
    -   **SQL**: `CREATE POLICY "Allow users to view their own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);`

3.  **INSERT Policy**:
    -   **Description**: Allows users to insert new expenses only for themselves.
    -   **SQL**: `CREATE POLICY "Allow users to insert their own expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);`

4.  **UPDATE Policy**:
    -   **Description**: Allows users to update only their own existing expenses.
    -   **SQL**: `CREATE POLICY "Allow users to update their own expenses" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);`

5.  **DELETE Policy**:
    -   **Description**: Allows users to delete only their own expenses.
    -   **SQL**: `CREATE POLICY "Allow users to delete their own expenses" ON public.expenses FOR DELETE USING (auth.uid() = user_id);`

## 5. Additional Notes

- **User Management**: User authentication and management are handled entirely by the Supabase `auth` schema. There is no separate public `users` table. The `auth.users` table serves as the source of truth for user data.
- **Currency**: The schema is designed to support only the PLN currency, as specified in the project scope. The `amount` column does not store currency information.
- **Cascading Deletes**: The `ON DELETE CASCADE` constraint on the `user_id` foreign key ensures that when a user is deleted from `auth.users`, all of their associated expense records are automatically and permanently removed, maintaining data integrity.

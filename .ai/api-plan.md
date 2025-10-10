# REST API Plan

## 1. Resources

- **Expenses**: Represents a user's expense record.
  - Corresponds to the `public.expenses` database table.
- **Dashboard**: A virtual resource that aggregates various statistics and data points for the user's dashboard view.
  - Gathers data from the `public.expenses` table.

## 2. Endpoints

### Expenses Resource

#### List Expenses
- **Method**: `GET`
- **Path**: `/api/expenses`
- **Description**: Retrieves a paginated list of expenses for the authenticated user, with support for filtering and sorting.
- **Query Parameters**:
  - `page` (optional, number, default: 1): The page number for pagination.
  - `limit` (optional, number, default: 10): The number of items per page.
  - `sort_by` (optional, string, enum: `date`, `amount`, default: `date`): The field to sort by.
  - `order` (optional, string, enum: `asc`, `desc`, default: `desc`): The sorting order.
  - `start_date` (optional, string, format: YYYY-MM-DD): The start date for filtering (inclusive).
  - `end_date` (optional, string, format: YYYY-MM-DD): The end date for filtering (inclusive).
- **Request Payload**: None
- **Response Payload (Success)**:
  ```json
  {
    "data": [
      {
        "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "amount": 150.75,
        "name": "Grocery Shopping",
        "description": "Weekly groceries from the supermarket",
        "date": "2025-10-15T10:00:00Z",
        "created_at": "2025-10-15T10:02:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total_items": 1,
      "total_pages": 1
    }
  }
  ```
- **Success Codes**: `200 OK`
- **Error Codes**: `401 Unauthorized`

#### Create an Expense
- **Method**: `POST`
- **Path**: `/api/expenses`
- **Description**: Creates a new expense record for the authenticated user.
- **Request Payload**:
  ```json
  {
    "amount": 150.75,
    "name": "Grocery Shopping",
    "description": "Weekly groceries from the supermarket",
    "date": "2025-10-15T10:00:00Z"
  }
  ```
- **Response Payload (Success)**:
  ```json
  {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "user_id": "f0e9d8c7-b6a5-4321-fedc-ba9876543210",
    "amount": 150.75,
    "name": "Grocery Shopping",
    "description": "Weekly groceries from the supermarket",
    "date": "2025-10-15T10:00:00Z",
    "created_at": "2025-10-15T10:02:00Z"
  }
  ```
- **Success Codes**: `201 Created`
- **Error Codes**: `400 Bad Request`, `401 Unauthorized`, `422 Unprocessable Entity`

#### Get a Single Expense
- **Method**: `GET`
- **Path**: `/api/expenses/{id}`
- **Description**: Retrieves a single expense by its ID.
- **Request Payload**: None
- **Response Payload (Success)**:
  ```json
  {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "amount": 150.75,
    "name": "Grocery Shopping",
    "description": "Weekly groceries from the supermarket",
    "date": "2025-10-15T10:00:00Z",
    "created_at": "2025-10-15T10:02:00Z"
  }
  ```
- **Success Codes**: `200 OK`
- **Error Codes**: `401 Unauthorized`, `404 Not Found`

#### Update an Expense
- **Method**: `PATCH`
- **Path**: `/api/expenses/{id}`
- **Description**: Updates one or more fields of an existing expense.
- **Request Payload**:
  ```json
  {
    "amount": 160.00,
    "description": "Updated description"
  }
  ```
- **Response Payload (Success)**:
  ```json
  {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "amount": 160.00,
    "name": "Grocery Shopping",
    "description": "Updated description",
    "date": "2025-10-15T10:00:00Z",
    "created_at": "2025-10-15T10:02:00Z"
  }
  ```
- **Success Codes**: `200 OK`
- **Error Codes**: `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `422 Unprocessable Entity`

#### Delete an Expense
- **Method**: `DELETE`
- **Path**: `/api/expenses/{id}`
- **Description**: Permanently deletes an expense record.
- **Request Payload**: None
- **Response Payload (Success)**: None
- **Success Codes**: `204 No Content`
- **Error Codes**: `401 Unauthorized`, `404 Not Found`

### Dashboard Resource

#### Get Dashboard Data
- **Method**: `GET`
- **Path**: `/api/dashboard`
- **Description**: Retrieves aggregated data and statistics needed for the main dashboard view.
- **Request Payload**: None
- **Response Payload (Success)**:
  ```json
  {
    "total_expenses": 12345.67,
    "current_month_expenses": 1450.80,
    "top_5_expenses": [
      {
        "id": "b1c2d3e4-...",
        "name": "New Laptop",
        "amount": 4500.00,
        "date": "2025-09-20T14:30:00Z"
      }
    ],
    "monthly_summary": [
      {
        "month": "2025-08",
        "total": 3200.50
      },
      {
        "month": "2025-09",
        "total": 7700.20
      },
      {
        "month": "2025-10",
        "total": 1450.80
      }
    ]
  }
  ```
- **Success Codes**: `200 OK`
- **Error Codes**: `401 Unauthorized`

## 3. Authentication and Authorization

- **Authentication**: Authentication will be handled via JSON Web Tokens (JWT) issued by Supabase Auth. The client application is responsible for acquiring and managing the JWT (e.g., via Supabase's `auth.getSession()`). API requests must include the JWT in the `Authorization` header as a Bearer token.
- **Implementation**: API routes, implemented as Astro endpoints, will use the Supabase client library to verify the session from the incoming request's cookies or Authorization header. If no valid session is found, a `401 Unauthorized` response will be returned.
- **Authorization**: Authorization is enforced at the database level using PostgreSQL's Row-Level Security (RLS) policies, as defined in the database schema plan. These policies ensure that users can only perform actions (SELECT, INSERT, UPDATE, DELETE) on their own expense records. The user's ID from the verified JWT is used by the database to enforce these policies automatically.

## 4. Validation and Business Logic

- **Validation**: Input validation will be performed at the API endpoint level for all `POST` and `PATCH` requests to ensure data integrity before it reaches the database. A library like `zod` will be used for schema validation.
  - **`amount`**: Must be a number greater than 0.
  - **`name`**: Must be a non-empty string (max length can be defined, e.g., 255).
  - **`date`**: Must be a valid ISO 8601 date string.
  - **`description`**: Can be a string or null (max length can be defined, e.g., 1000).
- **Business Logic**:
  - The core CRUD logic is a direct mapping to database operations, protected by RLS.
  - The `/api/dashboard` endpoint encapsulates the business logic for calculating statistics:
    - `total_expenses`: A `SUM` aggregation on the `amount` column for the user.
    - `current_month_expenses`: A `SUM` aggregation filtered to the current calendar month.
    - `top_5_expenses`: A `SELECT` query ordered by `amount` descending with a `LIMIT 5`.
    - `monthly_summary`: A `SUM` aggregation grouped by `date_trunc('month', date)`.

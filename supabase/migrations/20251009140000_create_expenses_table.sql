-- ============================================================================
-- Migration: Create expenses table
-- Created: 2025-10-09 14:00:00 UTC
-- Description: Creates the expenses table for tracking user expenses in PLN,
--              including all necessary constraints, indexes, and RLS policies.
-- Tables affected: public.expenses (created)
-- Notes: This migration sets up the core expense tracking functionality with
--        proper data isolation through Row Level Security.
-- ============================================================================

-- ============================================================================
-- 1. Create the expenses table
-- ============================================================================

-- Create the expenses table to store user expense records
-- Each expense belongs to a single user and tracks amount, name, description, and date
create table public.expenses (
  -- Primary key: unique identifier for each expense
  id uuid primary key default gen_random_uuid(),
  
  -- Foreign key to auth.users: links expense to the user who created it
  -- ON DELETE CASCADE ensures that when a user is deleted, all their expenses are removed
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- Amount of the expense in PLN (Polish złoty)
  -- Stored as numeric(10, 2) to handle amounts up to 99,999,999.99 PLN with exact decimal precision
  -- CHECK constraint ensures only positive amounts can be stored
  amount numeric(10, 2) not null check (amount > 0),
  
  -- Name/title of the expense (required)
  name text not null,
  
  -- Optional detailed description of the expense
  description text,
  
  -- Date and time when the expense was incurred
  -- Stored as timestamptz (timestamp with time zone) for accurate temporal tracking
  date timestamptz not null,
  
  -- Audit field: tracks when the expense record was created in the database
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 2. Create indexes for query optimization
-- ============================================================================

-- Index for queries that filter by user and sort by date (most recent first)
-- This is the most common query pattern: displaying a user's expenses chronologically
-- Composite index on (user_id, date DESC) allows efficient filtering and sorting
create index idx_expenses_user_id_date_desc on public.expenses (user_id, date desc);

-- Index for queries that find a user's largest expenses
-- Optimizes dashboard features like "Top 5 largest expenses"
-- Composite index on (user_id, amount DESC) allows efficient filtering and sorting by amount
create index idx_expenses_user_id_amount_desc on public.expenses (user_id, amount desc);

-- ============================================================================
-- 3. Enable Row Level Security (RLS)
-- ============================================================================

-- Enable RLS to ensure data isolation: users can only access their own expenses
-- This is critical for data privacy and security in a multi-tenant application
alter table public.expenses enable row level security;

-- ============================================================================
-- 4. Create RLS policies for authenticated users
-- ============================================================================

-- Policy: Allow authenticated users to view their own expenses
-- Rationale: Users should only see expenses they created
-- Implementation: Checks if the authenticated user's ID matches the expense's user_id
create policy "Allow authenticated users to view their own expenses"
  on public.expenses
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Allow authenticated users to insert their own expenses
-- Rationale: Users should only be able to create expenses for themselves
-- Implementation: Checks if the authenticated user's ID matches the user_id being inserted
create policy "Allow authenticated users to insert their own expenses"
  on public.expenses
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Policy: Allow authenticated users to update their own expenses
-- Rationale: Users should only be able to modify their own expense records
-- Implementation: Checks if the authenticated user's ID matches the expense's user_id
create policy "Allow authenticated users to update their own expenses"
  on public.expenses
  for update
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Allow authenticated users to delete their own expenses
-- Rationale: Users should only be able to remove their own expense records
-- Implementation: Checks if the authenticated user's ID matches the expense's user_id
create policy "Allow authenticated users to delete their own expenses"
  on public.expenses
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================================
-- 5. Create RLS policies for anonymous users
-- ============================================================================

-- Policy: Deny anonymous users from viewing expenses
-- Rationale: Expense data is private and should only be accessible to authenticated users
-- Implementation: Returns false for all anonymous access attempts
create policy "Deny anonymous users from viewing expenses"
  on public.expenses
  for select
  to anon
  using (false);

-- Policy: Deny anonymous users from inserting expenses
-- Rationale: Only authenticated users should be able to create expenses
-- Implementation: Returns false for all anonymous insert attempts
create policy "Deny anonymous users from inserting expenses"
  on public.expenses
  for insert
  to anon
  with check (false);

-- Policy: Deny anonymous users from updating expenses
-- Rationale: Only authenticated users should be able to modify expenses
-- Implementation: Returns false for all anonymous update attempts
create policy "Deny anonymous users from updating expenses"
  on public.expenses
  for update
  to anon
  using (false);

-- Policy: Deny anonymous users from deleting expenses
-- Rationale: Only authenticated users should be able to delete expenses
-- Implementation: Returns false for all anonymous delete attempts
create policy "Deny anonymous users from deleting expenses"
  on public.expenses
  for delete
  to anon
  using (false);

-- ============================================================================
-- End of migration
-- ============================================================================


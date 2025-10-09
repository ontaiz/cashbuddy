-- ============================================================================
-- Migration: Disable all RLS policies on expenses table
-- Created: 2025-10-09 14:00:01 UTC
-- Description: Drops all Row Level Security policies from the expenses table
--              while keeping RLS enabled on the table itself.
-- Tables affected: public.expenses
-- Notes: This migration removes all access policies. You may need to add
--        new policies or disable RLS entirely depending on your use case.
-- ============================================================================

-- ============================================================================
-- 1. Drop RLS policies for authenticated users
-- ============================================================================

-- Drop policy for viewing own expenses
drop policy if exists "Allow authenticated users to view their own expenses"
  on public.expenses;

-- Drop policy for inserting own expenses
drop policy if exists "Allow authenticated users to insert their own expenses"
  on public.expenses;

-- Drop policy for updating own expenses
drop policy if exists "Allow authenticated users to update their own expenses"
  on public.expenses;

-- Drop policy for deleting own expenses
drop policy if exists "Allow authenticated users to delete their own expenses"
  on public.expenses;

-- ============================================================================
-- 2. Drop RLS policies for anonymous users
-- ============================================================================

-- Drop policy denying anonymous users from viewing expenses
drop policy if exists "Deny anonymous users from viewing expenses"
  on public.expenses;

-- Drop policy denying anonymous users from inserting expenses
drop policy if exists "Deny anonymous users from inserting expenses"
  on public.expenses;

-- Drop policy denying anonymous users from updating expenses
drop policy if exists "Deny anonymous users from updating expenses"
  on public.expenses;

-- Drop policy denying anonymous users from deleting expenses
drop policy if exists "Deny anonymous users from deleting expenses"
  on public.expenses;

-- ============================================================================
-- End of migration
-- ============================================================================


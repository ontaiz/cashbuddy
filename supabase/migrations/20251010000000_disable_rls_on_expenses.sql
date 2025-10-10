-- ============================================================================
-- Migration: Disable RLS on expenses table
-- Created: 2025-10-10 00:00:00 UTC
-- Description: Disables Row Level Security on the expenses table to allow
--              unrestricted access during development.
-- Tables affected: public.expenses
-- Notes: This is suitable for development or single-user applications.
--        For production with multiple users, use RLS policies instead.
-- ============================================================================

-- Disable Row Level Security on expenses table
alter table public.expenses disable row level security;

-- ============================================================================
-- End of migration
-- ============================================================================


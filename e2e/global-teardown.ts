import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/db/database.types'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.test
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') })

/**
 * Global teardown for Playwright tests
 * Cleans up test data from Supabase after all tests complete
 */
async function globalTeardown() {
  console.log('\n🧹 Starting global teardown...')
  
  try {
    // Get environment variables
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_KEY
    const testEmail = process.env.E2E_USERNAME
    const testPassword = process.env.E2E_PASSWORD

    // Validate required environment variables
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_KEY must be set in .env.test')
    }

    if (!testEmail || !testPassword) {
      throw new Error('E2E_USERNAME and E2E_PASSWORD must be set in .env.test')
    }

    console.log(`📧 Cleaning up data for test user: ${testEmail}`)

    // Create Supabase client
    const supabase = createClient<Database>(supabaseUrl, supabaseKey)

    // Sign in as the test user to get their user ID
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    })

    if (authError || !authData.user) {
      throw new Error(`Failed to authenticate test user: ${authError?.message}`)
    }

    const userId = authData.user.id
    console.log(`👤 Test user ID: ${userId}`)

    // Delete all expenses for the test user
    const { data: deletedExpenses, error: deleteError } = await supabase
      .from('expenses')
      .delete()
      .eq('user_id', userId)
      .select()

    if (deleteError) {
      throw new Error(`Failed to delete expenses: ${deleteError.message}`)
    }

    const deletedCount = deletedExpenses?.length || 0
    console.log(`🗑️  Deleted ${deletedCount} expense(s) from database`)

    // Sign out the test user
    await supabase.auth.signOut()
    console.log('👋 Signed out test user')

    console.log('✅ Global teardown completed successfully\n')
  } catch (error) {
    console.error('❌ Global teardown failed:', error)
    // Don't throw - we don't want to fail the entire test suite if cleanup fails
    // The next test run will still work as tests should be idempotent
  }
}

export default globalTeardown


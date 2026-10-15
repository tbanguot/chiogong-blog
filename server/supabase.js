import { createClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase clients for serverless functions.
 * - `getPublicClient()` uses the anon key and is subject to RLS (safe for reads).
 * - `getAdminClient()` uses the service-role key and BYPASSES RLS. Server only.
 */
const url = () => process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL

const options = { auth: { persistSession: false, autoRefreshToken: false } }

export function getPublicClient() {
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (!url() || !key) throw new Error('Supabase public credentials are not configured.')
  return createClient(url(), key, options)
}

export function getAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url() || !key) throw new Error('Supabase service-role credentials are not configured.')
  return createClient(url(), key, options)
}

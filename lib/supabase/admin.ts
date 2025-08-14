import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const DEFAULT_SUPABASE_URL = "https://qmjxxvagyfabiyuiinlm.supabase.co"
const DEFAULT_SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtanh4dmFneWZhYml5dWlpbmxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NjMwNDYsImV4cCI6MjA3MDMzOTA0Nn0.pUSsnv5ckUx_YTFV3J-gum-roVX1a0ifKWyRYofgWWA"
const DEFAULT_SERVICE_ROLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtanh4dmFneWZhYml5dWlpbmxtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc2MzA0NiwiZXhwIjoyMDcwMzM5MDQ2fQ.Uga_lI81-LY9OIWpM0oZi-Z-xbicZF9dZ8OqnvX3kOA"

/**
 * getAdminClient
 * - Tries SERVICE_ROLE first (best for RLS)
 * - Falls back to server/client ANON keys
 * - If nothing is available, returns null (callers handle with empty { ok: true, data: [] } on GET)
 */
export function getAdminClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    DEFAULT_SERVICE_ROLE ||
    DEFAULT_SUPABASE_ANON

  if (!url || !key) return null

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function isMissingTableError(err: any) {
  const code = String(err?.code || "").toUpperCase()
  const msg = String(err?.message || "")
  return (
    ["42P01", "PGRST202", "PGRST301"].includes(code) ||
    /relation .* does not exist/i.test(msg) ||
    /table .* does not exist/i.test(msg) ||
    /could not find the table .* in the schema cache/i.test(msg)
  )
}

/**
 * Try a list of table names and return the first that exists.
 * If none exist, returns { table: null } so callers can respond with data: [].
 * If an unexpected error occurs, return it so the route can surface an error message.
 */
export async function detectExistingTable(
  supabase: SupabaseClient,
  candidates: string[],
): Promise<{ table: string | null; error?: any }> {
  for (const name of candidates) {
    const r = await supabase.from(name).select("id", { head: true, count: "exact" })
    if (!r.error) return { table: name }
    if (!isMissingTableError(r.error)) return { table: null, error: r.error }
  }
  return { table: null }
}

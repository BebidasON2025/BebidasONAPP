import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const DEFAULT_SUPABASE_URL = "https://qmjxxvagyfabiyuiinlm.supabase.co"
const DEFAULT_SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtanh4dmFneWZhYml5dWlpbmxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NjMwNDYsImV4cCI6MjA3MDMzOTA0Nn0.pUSsnv5ckUx_YTFV3J-gum-roVX1a0ifKWyRYofgWWA"
const DEFAULT_SERVICE_ROLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtanh4dmFneWZhYml5dWlpbmxtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc2MzA0NiwiZXhwIjoyMDcwMzM5MDQ2fQ.Uga_lI81-LY9OIWpM0oZi-Z-xbicZF9dZ8OqnvX3kOA"

/**
 * Centralized, resilient Supabase admin client creation.
 * Tries SERVICE_ROLE first, then ANON, and supports NEXT_PUBLIC fallbacks.
 */
export function getAdminSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    DEFAULT_SERVICE_ROLE ||
    DEFAULT_SUPABASE_ANON

  if (!url || !key) {
    // Create a good error but do not throw generic undefined
    throw new Error("Supabase URL/KEY ausentes nas variáveis de ambiente")
  }
  return createClient(url, key, { auth: { persistSession: false } })
}

/**
 * True if the PostgREST error indicates a missing table or schema cache miss.
 */
export function isMissingTableError(err: any) {
  const code = (err?.code || "").toString().toUpperCase()
  return (
    code === "42P01" ||
    code === "PGRST202" ||
    code === "PGRST301" ||
    /relation .* does not exist/i.test(err?.message || "") ||
    /table .* does not exist/i.test(err?.message || "") ||
    /could not find the table .* in the schema cache/i.test(err?.message || "")
  )
}

/**
 * Returns the first table that exists from a set of candidates.
 * We probe by issuing a HEAD-select.
 */
export async function resolveExistingTable(supabase: SupabaseClient, candidates: string[]): Promise<string> {
  for (const t of candidates) {
    const r = await supabase.from(t).select("id", { head: true, count: "exact" })
    if (!r.error) return t
    if (!isMissingTableError(r.error)) {
      // If error is not "missing table", rethrow so callers can see permission or RLS issues.
      throw r.error
    }
  }
  // Fallback to the last candidate if none exist; callers will likely 404 on first use.
  return candidates[candidates.length - 1]
}

/**
 * Finds the first column that exists on a table by probing a tiny select.
 * Returns null if none exist.
 */
export async function resolveExistingColumn(
  supabase: SupabaseClient,
  table: string,
  columns: string[],
): Promise<string | null> {
  for (const col of columns) {
    const r = await supabase.from(table).select(col).limit(1)
    if (!r.error) return col
    // If it's not a column-not-found error, we still continue, because we are only detecting presence.
    // Typical error for missing column is 400: column does not exist.
  }
  return null
}

/**
 * Utility to build a safe column list for select(). Filters out nulls and dedupes.
 */
export function cols(...names: Array<string | null | undefined>) {
  return Array.from(new Set(names.filter(Boolean) as string[])).join(", ")
}

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Creates a Supabase admin client using the correct environment variables
 * from the user's Supabase integration
 */
export function getSupabaseAdmin(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error("Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL environment variable")
  }

  // Prefer service role for admin operations
  if (serviceKey) {
    return createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  // Fallback to anon key
  if (anonKey) {
    return createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variable")
}

/** Erro de tabela inexistente */
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

/** Tenta HEAD na tabela para verificar existência. */
export async function ensureTableExists(
  supabase: SupabaseClient,
  table: string,
): Promise<{ exists: boolean; error?: any }> {
  const r = await supabase.from(table).select("id", { head: true, count: "exact" })
  if (!r.error) return { exists: true }
  if (isMissingTableError(r.error)) return { exists: false }
  return { exists: false, error: r.error }
}

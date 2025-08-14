import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const DEFAULT_SUPABASE_URL = "https://qmjxxvagyfabiyuiinlm.supabase.co"
const DEFAULT_SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtanh4dmFneWZhYml5dWlpbmxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NjMwNDYsImV4cCI6MjA3MDMzOTA0Nn0.pUSsnv5ckUx_YTFV3J-gum-roVX1a0ifKWyRYofgWWA"
const DEFAULT_SERVICE_ROLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtanh4dmFneWZhYml5dWlpbmxtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc2MzA0NiwiZXhwIjoyMDcwMzM5MDQ2fQ.Uga_lI81-LY9OIWpM0oZi-Z-xbicZF9dZ8OqnvX3kOA"

/**
 * Cliente do Supabase no servidor.
 * - EXIGE SUPABASE_URL
 * - Usa SUPABASE_SERVICE_ROLE_KEY se disponível (admin); caso contrário, usa NEXT_PUBLIC_SUPABASE_ANON_KEY (somente leitura).
 */
export function getSupabaseServerClient(): SupabaseClient {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL)
    .trim()
    .replace(/\/+$/, "")

  if (!/^https?:\/\//i.test(url)) {
    throw new Error(`SUPABASE_URL inválida: "${url}".`)
  }

  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || DEFAULT_SERVICE_ROLE
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || DEFAULT_SUPABASE_ANON
  const key = service || anon

  if (!service) {
    console.warn("[Supabase] Server usando ANON (sem service_role). Se RLS estiver ativa, crie policies adequadas.")
  }

  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

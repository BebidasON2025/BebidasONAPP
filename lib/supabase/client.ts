"use client"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const DEFAULT_SUPABASE_URL = "https://qmjxxvagyfabiyuiinlm.supabase.co"
const DEFAULT_SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtanh4dmFneWZhYml5dWlpbmxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NjMwNDYsImV4cCI6MjA3MDMzOTA0Nn0.pUSsnv5ckUx_YTFV3J-gum-roVX1a0ifKWyRYofgWWA"

declare global {
  interface Window {
    __supabase?: SupabaseClient
  }
}

/**
 * Cliente do Supabase no navegador.
 * - EXIGE NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
 * - Sem fallbacks (para não "grudar" no projeto antigo por engano)
 */
export function getSupabaseBrowserClient() {
  if (typeof window === "undefined") {
    throw new Error("getSupabaseBrowserClient() só pode ser usado no cliente")
  }
  if (!window.__supabase) {
    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim().replace(/\/+$/, "")
    const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON).trim()

    if (!/^https?:\/\//i.test(url)) {
      throw new Error(`Supabase (client): URL inválida "${url}"`)
    }

    window.__supabase = createClient(url, anon, { auth: { persistSession: true, autoRefreshToken: true } })
  }
  return window.__supabase!
}

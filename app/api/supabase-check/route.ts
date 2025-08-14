import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

async function tableHead(supabase: ReturnType<typeof createClient>, t: string) {
  const r = await supabase.from(t).select("id", { head: true, count: "exact" })
  const missing =
    !!r.error &&
    (["42P01", "PGRST202", "PGRST301"].includes((r.error.code || "").toUpperCase()) ||
      /relation .* does not exist/i.test(r.error.message || "") ||
      /table .* does not exist/i.test(r.error.message || "") ||
      /could not find the table .* in the schema cache/i.test(r.error.message || ""))
  return { missing, error: r.error, count: r.count ?? null }
}

export async function GET() {
  const envUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim()
  const envService = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  const envAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  const url = envUrl.replace(/\/+$/, "")
  const key = (envService || envAnon || "").trim()

  if (!url || !key) {
    return NextResponse.json(
      {
        ok: false,
        error: "Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente.",
        supabaseUrl: url || null,
        mode: "missing",
        hints: [
          "Verifique se as variáveis de ambiente estão configuradas:",
          "SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY",
        ],
      },
      { status: 500 },
    )
  }

  if (!/^https?:\/\//i.test(url)) {
    return NextResponse.json(
      {
        ok: false,
        error: "URL do Supabase inválida. Deve começar com http:// ou https://",
        supabaseUrl: url,
        mode: "invalid_url",
      },
      { status: 500 },
    )
  }

  const mode = envService ? "service_role" : "anon"

  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const prod = await tableHead(supabase, "produtos")

    let tableDetected: "produtos" | null = null
    let productsCount: number | null = null

    if (!prod.missing) {
      tableDetected = "produtos"
      productsCount = prod.count
    }

    // If there was a non-missing error, report it
    if (prod.error && !prod.missing) {
      return NextResponse.json(
        {
          ok: false,
          supabaseUrl: url,
          mode,
          error: prod.error.message,
          hints: ["Erro ao acessar a tabela produtos.", "Verifique se as permissões estão configuradas corretamente."],
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      ok: true,
      supabaseUrl: url,
      mode,
      tableDetected,
      productsCount,
      hints: [],
    })
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: String(e),
        supabaseUrl: url,
        mode,
        hints: ["Erro de conexão com o Supabase.", "Verifique se a URL e as chaves estão corretas."],
      },
      { status: 500 },
    )
  }
}

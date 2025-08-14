import { NextResponse } from "next/server"

function mask(val?: string | null, head = 6, tail = 4) {
  if (!val) return null
  if (val.length <= head + tail) return val
  return `${val.slice(0, head)}…${val.slice(-tail)}`
}

export async function GET() {
  const urlServer = process.env.SUPABASE_URL
  const urlPublic = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY

  const effectiveUrl = (urlServer || urlPublic || "").trim().replace(/\/+$/, "")

  const ok = Boolean(effectiveUrl && anon)

  return NextResponse.json(
    {
      ok,
      present: {
        SUPABASE_URL: Boolean(urlServer),
        NEXT_PUBLIC_SUPABASE_URL: Boolean(urlPublic),
        NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(anon),
        SUPABASE_SERVICE_ROLE_KEY: Boolean(service),
      },
      values: {
        effectiveUrl,
        SUPABASE_URL: mask(urlServer),
        NEXT_PUBLIC_SUPABASE_URL: mask(urlPublic),
        NEXT_PUBLIC_SUPABASE_ANON_KEY: anon ? `len:${anon.length}, preview:${mask(anon)}` : null,
        SUPABASE_SERVICE_ROLE_KEY: service ? `len:${service.length}, preview:${mask(service)}` : null,
      },
      hints: [
        "Defina SUPABASE_URL e NEXT_PUBLIC_SUPABASE_URL com o mesmo Project URL do Supabase.",
        "Defina NEXT_PUBLIC_SUPABASE_ANON_KEY com a anon public key.",
        "Opcional: SUPABASE_SERVICE_ROLE_KEY para operações administrativas no servidor.",
        "Após salvar, reimplante o preview e recarregue a página.",
      ],
    },
    { status: ok ? 200 : 500 },
  )
}

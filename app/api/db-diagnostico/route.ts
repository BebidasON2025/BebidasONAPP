import { NextResponse } from "next/server"
import { Client } from "pg"

function getConnString() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL
  )
}

export async function GET() {
  const conn = getConnString()
  if (!conn) {
    return NextResponse.json(
      {
        ok: false,
        stage: "env",
        error:
          "String de conexão não encontrada. Defina DATABASE_URL / POSTGRES_URL / POSTGRES_PRISMA_URL / POSTGRES_URL_NON_POOLING.",
        hints: [
          "No Supabase, copie a Connection String (sem pool) de Settings > Database > Connection strings > URI.",
          "Cole-a em POSTGRES_URL (ou POSTGRES_URL_NON_POOLING).",
        ],
      },
      { status: 500 },
    )
  }

  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } })
  const urlShown = (conn.includes("@") ? conn.split("@")[1] : conn).split("?")[0]

  try {
    await client.connect()
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        stage: "connect",
        db: urlShown,
        error: String(e?.message || e),
        code: (e && e.code) || undefined,
        hints: [
          "Verifique host, usuário, senha e porta na Connection String.",
          "Se estiver usando Supabase, use a connection string do Postgres (não a Project URL).",
          "Confirme que a instância aceita SSL; usamos ssl { rejectUnauthorized: false }.",
        ],
      },
      { status: 500 },
    )
  }

  try {
    const meta = await client.query("select version(), now()")
    let existsProdutos = false
    let produtosCount: number | null = null
    try {
      const exists = await client.query("select to_regclass('public.produtos') is not null as ok")
      existsProdutos = Boolean(exists.rows?.[0]?.ok)
      if (existsProdutos) {
        const r = await client.query("select count(*)::int as c from produtos")
        produtosCount = r.rows?.[0]?.c ?? 0
      }
    } catch (e: any) {
      // segue; mostraremos erro geral mais abaixo
    }

    const tablesPTBR = await client.query(
      `select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by table_name asc`,
    )

    return NextResponse.json({
      ok: true,
      db: urlShown,
      meta: { version: meta.rows?.[0]?.version, now: meta.rows?.[0]?.now },
      existsProdutos,
      produtosCount,
      tables: tablesPTBR.rows.map((r) => r.table_name),
    })
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        stage: "inspect",
        db: urlShown,
        error: String(e?.message || e),
      },
      { status: 500 },
    )
  } finally {
    await client.end().catch(() => {})
  }
}

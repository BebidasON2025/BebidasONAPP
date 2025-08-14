import { NextResponse } from "next/server"
import { Client } from "pg"

export async function GET() {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL

  if (!url) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Defina DATABASE_URL/POSTGRES_URL/POSTGRES_PRISMA_URL/POSTGRES_URL_NON_POOLING nas variáveis de ambiente.",
      },
      { status: 500 },
    )
  }

  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
  try {
    await client.connect()
    const info = await client.query("select version(), now(), current_database()")
    let productsCount: number | null = null
    try {
      const r = await client.query("select count(*)::int as c from products")
      productsCount = r.rows[0]?.c ?? null
    } catch {
      // tabela ainda não existe
    }
    return NextResponse.json({
      ok: true,
      db: info.rows[0],
      productsCount,
      urlUsed: (url.includes("@") ? url.split("@")[1] : url).split("?")[0],
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  } finally {
    await client.end().catch(() => {})
  }
}

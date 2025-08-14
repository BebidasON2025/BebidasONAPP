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
        error:
          "String de conexão ausente. Defina DATABASE_URL/POSTGRES_URL/POSTGRES_PRISMA_URL/POSTGRES_URL_NON_POOLING.",
      },
      { status: 500 },
    )
  }

  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } })
  try {
    await client.connect()

    // Verifica se a tabela existe
    const exists = await client.query("select to_regclass('public.produtos') is not null as ok")
    const hasTable = Boolean(exists.rows?.[0]?.ok)
    if (!hasTable) {
      return NextResponse.json(
        {
          ok: false,
          error: "Tabela 'produtos' não existe.",
          hints: ["Abra /api/db-reset para reinstalar o banco em PT‑BR (cria todas as tabelas + seeds)."],
        },
        { status: 500 },
      )
    }

    const r = await client.query("select count(*)::int as c from produtos")
    const count = r.rows?.[0]?.c ?? 0
    if (count > 0) {
      return NextResponse.json({ ok: true, seeded: 0, total: count })
    }

    // Insere seeds mínimos
    await client.query(`
      insert into produtos (nome, categoria, preco, estoque, alerta_estoque, codigo_barras) values
      ('Antártica lata 350 ml', 'Cervejas', 4.90, 0, 2, null),
      ('Skol lata 350 ml', 'Cervejas', 4.70, 0, 2, null),
      ('Coca-Cola 2L', 'Refrigerantes', 12.90, 1, 3, '7894900010015'),
      ('Guaraná 2L', 'Refrigerantes', 10.90, 1, 3, null),
      ('Heineken 600 ml', 'Cervejas', 12.50, 2, 3, null);
    `)
    const r2 = await client.query("select count(*)::int as c from produtos")
    return NextResponse.json({ ok: true, seeded: 5, total: r2.rows?.[0]?.c ?? 5 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  } finally {
    await client.end().catch(() => {})
  }
}

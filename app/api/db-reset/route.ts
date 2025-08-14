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

async function runSqlFile(client: Client, file: string) {
  const path = `/scripts/sql/${file}`
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Falha ao carregar ${file}: ${res.status} ${res.statusText}`)
  const sql = await res.text()
  await client.query(sql)
}

const dropAllSql = `
begin;

-- Tabelas PT-BR
drop table if exists itens_pedido cascade;
drop table if exists pedidos cascade;
drop table if exists lancamentos_financeiros cascade;
drop table if exists notas_fiscais cascade;
drop table if exists itens_fiado cascade;
drop table if exists comprovantes_fiado cascade;
drop table if exists produtos cascade;
drop table if exists clientes cascade;
drop table if exists fornecedores cascade;

-- Tabelas EN (caso existam)
drop table if exists order_items cascade;
drop table if exists orders cascade;
drop table if exists finance_entries cascade;
drop table if exists invoices cascade;
drop table if exists fiado_items cascade;
drop table if exists fiado_receipts cascade;
drop table if exists products cascade;
drop table if exists customers cascade;
drop table if exists suppliers cascade;

-- Funções/triggers conhecidos (ambas versões)
do $$
begin
  if exists (select 1 from pg_proc where proname = 'set_atualizado_em') then
    drop function set_atualizado_em() cascade;
  end if;
  if exists (select 1 from pg_proc where proname = 'on_pedido_pago') then
    drop function on_pedido_pago() cascade;
  end if;
  if exists (select 1 from pg_proc where proname = 'on_fiado_pago') then
    drop function on_fiado_pago() cascade;
  end if;

  if exists (select 1 from pg_proc where proname = 'set_updated_at') then
    drop function set_updated_at() cascade;
  end if;
  if exists (select 1 from pg_proc where proname = 'on_order_paid') then
    drop function on_order_paid() cascade;
  end if;
  if exists (select 1 from pg_proc where proname = 'on_fiado_paid') then
    drop function on_fiado_paid() cascade;
  end if;
end $$;

commit;

create extension if not exists "pgcrypto";
`

export async function GET(req: Request) {
  const conn = getConnString()
  if (!conn) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "String de conexão ausente. Defina DATABASE_URL/POSTGRES_URL/POSTGRES_PRISMA_URL/POSTGRES_URL_NON_POOLING nas variáveis de ambiente.",
      },
      { status: 500 },
    )
  }

  const url = new URL(req.url)
  const cleanOnly = url.searchParams.get("clean") === "1"

  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } })
  await client.connect()

  const steps: Array<{ step: string; ok: boolean; error?: string }> = []
  try {
    if (cleanOnly) {
      try {
        await client.query(dropAllSql)
        steps.push({ step: "clean", ok: true })
      } catch (e: any) {
        steps.push({ step: "clean", ok: false, error: String(e) })
        throw e
      }
    } else {
      try {
        await runSqlFile(client, "000_instalacao_ptbr.sql")
        steps.push({ step: "install_ptbr", ok: true })
      } catch (e: any) {
        steps.push({ step: "install_ptbr", ok: false, error: String(e) })
        throw e
      }
    }

    let produtosCount: number | null = null
    try {
      const r = await client.query("select count(*)::int as c from produtos")
      produtosCount = r.rows[0]?.c ?? null
    } catch {
      produtosCount = null
    }

    return NextResponse.json({
      ok: true,
      mode: cleanOnly ? "clean" : "install_ptbr",
      steps,
      produtosCount,
      db: (conn.includes("@") ? conn.split("@")[1] : conn).split("?")[0],
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, steps, error: String(e) }, { status: 500 })
  } finally {
    await client.end().catch(() => {})
  }
}

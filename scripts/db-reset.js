// Reset total + instalação do schema PT-BR usando um único arquivo.
// Execute no Runner.

import { Client } from "pg"

async function loadSql(file) {
  const res = await fetch(`/scripts/sql/${file}`)
  if (!res.ok) throw new Error(`Falha ao carregar ${file}: ${res.status} ${res.statusText}`)
  return res.text()
}
function getConn() {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL
  if (!url) {
    throw new Error(
      "String de conexão não encontrada. Defina DATABASE_URL/POSTGRES_URL/POSTGRES_PRISMA_URL/POSTGRES_URL_NON_POOLING.",
    )
  }
  return url
}
async function run() {
  const conn = getConn()
  const shown = (conn.includes("@") ? conn.split("@")[1] : conn).split("?")[0]
  console.log("Conectando em:", shown)

  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } })
  await client.connect()
  try {
    console.log("== INSTALAÇÃO DO ZERO (PT-BR) ==")
    const sql = await loadSql("000_instalacao_ptbr.sql")
    await client.query(sql)
    console.log("OK instalação")

    const r = await client.query("select count(*)::int as c from produtos")
    console.log("Produtos:", r.rows[0]?.c ?? 0)
  } finally {
    await client.end().catch(() => {})
  }
}
run().catch((e) => {
  console.error(e)
  process.exit(1)
})

import { Client } from "pg"

async function run() {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL

  if (!url) {
    console.error(
      [
        "Não foi possível encontrar a string de conexão do Postgres.",
        "Defina uma das variáveis: DATABASE_URL, POSTGRES_URL, POSTGRES_PRISMA_URL ou POSTGRES_URL_NON_POOLING.",
      ].join("\n"),
    )
    process.exit(1)
  }

  const shown = (url.includes("@") ? url.split("@")[1] : url).split("?")[0]
  console.log("Usando conexão:", shown)

  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()

  try {
    const path = "/scripts/sql/000_all_supabase.sql"
    const res = await fetch(path)
    if (!res.ok) {
      throw new Error(`Falha ao carregar ${path}: ${res.status} ${res.statusText}`)
    }
    const sql = await res.text()
    console.log(`\n== Executando ${path} ==`)
    await client.query(sql)
    console.log("OK 000_all_supabase.sql")
  } finally {
    await client.end()
  }
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})

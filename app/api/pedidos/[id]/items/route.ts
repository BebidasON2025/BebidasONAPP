import { NextResponse } from "next/server"
import { getSupabaseAdmin, ensureTableExists } from "@/lib/db-helpers"

const PEDIDOS_TABLE = "pedidos"
const PRODUCT_TABLE = "produtos"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const orderId = params?.id
    if (!orderId) return NextResponse.json({ ok: false, error: "Missing order id", data: [] }, { status: 400 })

    const supabase = getSupabaseAdmin()

    const pedidosExists = await ensureTableExists(supabase, PEDIDOS_TABLE)
    const prodExists = await ensureTableExists(supabase, PRODUCT_TABLE)

    if (pedidosExists.error)
      return NextResponse.json({ ok: false, error: pedidosExists.error.message, data: [] }, { status: 500 })
    if (!pedidosExists.exists)
      return NextResponse.json({
        ok: true,
        data: [],
        meta: { pedidosTable: null, productTable: prodExists.exists ? PRODUCT_TABLE : null },
      })

    const r = await supabase.from(PEDIDOS_TABLE).select("itens").eq("id", orderId).single()
    if (r.error) return NextResponse.json({ ok: false, error: r.error.message, data: [] }, { status: 500 })

    const items = r.data?.itens || []
    if (!Array.isArray(items)) {
      return NextResponse.json({ ok: true, data: [] })
    }

    const productIds = Array.from(new Set(items.map((x: any) => x.produto_id).filter(Boolean)))
    const productsMap: Record<string, any> = {}
    if (prodExists.exists && productIds.length) {
      const pr = await supabase.from(PRODUCT_TABLE).select("*").in("id", productIds)
      if (!pr.error && pr.data) for (const p of pr.data) productsMap[p.id] = p
    }

    const data = items.map((it: any, index: number) => {
      const p = it.produto_id ? productsMap[it.produto_id] : null
      const qty = Number(it.quantidade ?? it.qtd ?? 0)
      const price = Number(it.preco ?? p?.preco ?? 0)
      const description = it.nome ?? p?.nome ?? "Item"
      return {
        id: String(it.id ?? `item-${index}`),
        description,
        qty,
        price,
      }
    })

    return NextResponse.json({ ok: true, data })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e), data: [] }, { status: 500 })
  }
}

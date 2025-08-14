import { NextResponse } from "next/server"
import { getSupabaseAdmin, ensureTableExists } from "@/lib/db-helpers"

const ITEM_TABLE = "itens_fiado"
const PRODUCT_TABLE = "produtos"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const comprovanteId = params?.id
    if (!comprovanteId) return NextResponse.json({ ok: false, error: "Missing id", data: [] }, { status: 400 })

    const supabase = getSupabaseAdmin()
    const itemExists = await ensureTableExists(supabase, ITEM_TABLE)
    const prodExists = await ensureTableExists(supabase, PRODUCT_TABLE)
    if (itemExists.error)
      return NextResponse.json({ ok: false, error: itemExists.error.message, data: [] }, { status: 500 })
    if (!itemExists.exists)
      return NextResponse.json({
        ok: true,
        data: [],
        meta: { itemTable: null, productTable: prodExists.exists ? PRODUCT_TABLE : null },
      })

    const r = await supabase.from(ITEM_TABLE).select("*").eq("comprovante_id", comprovanteId)
    if (r.error) return NextResponse.json({ ok: false, error: r.error.message, data: [] }, { status: 500 })

    const pids = Array.from(new Set((r.data || []).map((x: any) => x.produto_id).filter(Boolean)))
    const productsMap: Record<string, any> = {}
    if (prodExists.exists && pids.length) {
      const pr = await supabase.from(PRODUCT_TABLE).select("*").in("id", pids)
      if (!pr.error && pr.data) for (const p of pr.data) productsMap[p.id] = p
    }

    const data =
      (r.data || []).map((it: any) => {
        const p = it.produto_id ? productsMap[it.produto_id] : null
        const qty = Number(it.qtd ?? it.quantidade ?? 0)
        const price = Number(it.preco ?? it.preco_unitario ?? p?.preco ?? p?.preco_venda ?? p?.price ?? 0)
        const description = it.nome_produto ?? p?.nome ?? p?.name ?? "Item"
        return { id: String(it.id), description, qty, price }
      }) || []

    return NextResponse.json({ ok: true, data })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e), data: [] }, { status: 500 })
  }
}

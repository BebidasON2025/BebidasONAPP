import { NextResponse } from "next/server"
import { getSupabaseAdmin, ensureTableExists, isMissingTableError } from "@/lib/db-helpers"

const ORDER_TABLE = "pedidos"
const PRODUCT_TABLE = "produtos"
const ITEM_TABLE = "itens_pedido"

type PedidoItemAny = {
  produto_id?: string
  produtoId?: string
  productId?: string
  id?: string
  qtd?: number
  qty?: number
  preco?: number
  price?: number
}

type PedidoPayload = {
  cliente_id?: string | null
  metodo?: string | null
  method?: string | null
  status?: "novo" | "pendente" | "pago" | "cancelado" | null
  desconto?: number
  taxa_entrega?: number
  data?: string | null
  items?: PedidoItemAny[]
  total?: number | null
  cliente_nome_texto?: string | null
}

async function generateOrderNumber(supabase: any): Promise<string> {
  try {
    // Get the count of existing orders to generate next number
    const { count } = await supabase.from(ORDER_TABLE).select("*", { count: "exact", head: true })

    const nextNumber = (count || 0) + 1
    return `VENDA${nextNumber.toString().padStart(5, "0")}`
  } catch (error) {
    // Fallback to timestamp-based ID if count fails
    const timestamp = Date.now().toString().slice(-5)
    return `VENDA${timestamp}`
  }
}

export async function GET(req: Request) {
  try {
    const supabase = getSupabaseAdmin()
    const { exists, error } = await ensureTableExists(supabase, ORDER_TABLE)
    if (error) return NextResponse.json({ ok: false, error: error.message, data: [] }, { status: 500 })
    if (!exists) return NextResponse.json({ ok: true, data: [], table: null })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")

    let query = supabase.from(ORDER_TABLE).select("*")
    if (status) query = query.eq("status", status)

    const orderCols = ["data", "criado_em", "created_at", "atualizado_em", "updated_at"]
    let data: any[] = []
    let lastErr: any = null

    for (const col of orderCols) {
      const r = await query.order(col as any, { ascending: false })
      if (!r.error) {
        data = r.data || []
        lastErr = null
        break
      }
      lastErr = r.error
    }

    if (lastErr) {
      if (isMissingTableError(lastErr)) return NextResponse.json({ ok: true, data: [], table: ORDER_TABLE })
      return NextResponse.json({ ok: false, error: lastErr.message, data: [] }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data, table: ORDER_TABLE })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e), data: [] }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json().catch(() => ({}))) as PedidoPayload
    const supabase = getSupabaseAdmin()

    const ordersExists = await ensureTableExists(supabase, ORDER_TABLE)
    if (ordersExists.error) return NextResponse.json({ ok: false, error: ordersExists.error.message }, { status: 500 })
    if (!ordersExists.exists)
      return NextResponse.json({ ok: false, error: "Tabela 'pedidos' inexistente." }, { status: 400 })

    const itemsRaw = Array.isArray(payload.items) ? payload.items : []
    const items = itemsRaw
      .map((it) => {
        const produto_id = it.produto_id || it.produtoId || it.productId || it.id
        const qtd = Number(it.qtd ?? it.qty ?? 0)
        const preco = Number(it.preco ?? it.price ?? 0)
        return { produto_id, qtd, preco }
      })
      .filter((i) => i.produto_id && i.qtd > 0)

    const itensTotal = items.reduce((acc, it) => acc + Number(it.preco ?? 0) * Number(it.qtd ?? 0), 0)
    const desconto = Number(payload.desconto ?? 0)
    const taxa = Number(payload.taxa_entrega ?? 0)
    const computedTotal = itensTotal + taxa - desconto
    const total = Number(payload.total ?? computedTotal)
    const metodo = payload.metodo ?? payload.method ?? "Dinheiro"
    const status = (payload.status ?? (metodo?.toLowerCase() === "fiado" ? "pendente" : "pago")) as
      | "novo"
      | "pendente"
      | "pago"
      | "cancelado"
    const nowIso = new Date().toISOString()

    const orderNumber = await generateOrderNumber(supabase)

    const insertOrder = {
      numero_pedido: orderNumber,
      cliente_id: payload.cliente_id ?? null,
      cliente_nome_texto: payload.cliente_nome_texto ?? null,
      metodo,
      status,
      total,
      data: payload.data ?? nowIso,
      criado_em: nowIso,
      atualizado_em: nowIso,
    }

    const created = await supabase.from(ORDER_TABLE).insert([insertOrder]).select("id, numero_pedido").single()
    if (created.error) return NextResponse.json({ ok: false, error: created.error.message }, { status: 500 })
    const pedidoId = created.data?.id as string
    const pedidoNumber = created.data?.numero_pedido || orderNumber

    // Inserir itens
    const itemsExists = await ensureTableExists(supabase, ITEM_TABLE)
    if (!itemsExists.error && itemsExists.exists && items.length > 0) {
      const toInsert = items.map((it) => ({
        pedido_id: pedidoId,
        produto_id: it.produto_id!,
        qtd: Number(it.qtd ?? 0),
        preco: Number(it.preco ?? 0),
      }))
      const itemsIns = await supabase.from(ITEM_TABLE).insert(toInsert)
      if (itemsIns.error) return NextResponse.json({ ok: false, error: itemsIns.error.message }, { status: 500 })
    }

    // Baixar estoque
    if (items.length > 0) {
      const prodExists = await ensureTableExists(supabase, PRODUCT_TABLE)
      if (!prodExists.error && prodExists.exists) {
        const byProduct = new Map<string, number>()
        for (const it of items) {
          byProduct.set(it.produto_id!, (byProduct.get(it.produto_id!) ?? 0) + Number(it.qtd ?? 0))
        }
        const ids = Array.from(byProduct.keys())
        if (ids.length) {
          const stocks = await supabase.from(PRODUCT_TABLE).select("id, estoque").in("id", ids)
          if (!stocks.error) {
            const updates =
              (stocks.data || []).map((row: any) => {
                const dec = byProduct.get(row.id) ?? 0
                const current = Number(row.estoque ?? 0)
                const next = Math.max(0, current - dec)
                return { id: row.id, estoque: next }
              }) || []
            for (const u of updates) {
              await supabase.from(PRODUCT_TABLE).update({ estoque: u.estoque }).eq("id", u.id)
            }
          }
        }
      }
    }

    return NextResponse.json({ ok: true, id: pedidoId, numero: pedidoNumber })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const payload = await req.json().catch(() => ({}))
    const id = payload.id
    if (!id) return NextResponse.json({ ok: false, error: "ID obrigatório" }, { status: 400 })

    const supabase = getSupabaseAdmin()
    const { exists, error } = await ensureTableExists(supabase, ORDER_TABLE)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    if (!exists) return NextResponse.json({ ok: false, error: "Tabela 'pedidos' inexistente." }, { status: 400 })

    const itemsExists = await ensureTableExists(supabase, ITEM_TABLE)
    if (!itemsExists.error && itemsExists.exists) {
      await supabase.from(ITEM_TABLE).delete().eq("pedido_id", id)
    }

    const result = await supabase.from(ORDER_TABLE).delete().eq("id", id)
    if (result.error) return NextResponse.json({ ok: false, error: result.error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const payload = await req.json().catch(() => ({}))
    const { id, status } = payload
    if (!id) return NextResponse.json({ ok: false, error: "ID obrigatório" }, { status: 400 })
    if (!status) return NextResponse.json({ ok: false, error: "Status obrigatório" }, { status: 400 })

    const supabase = getSupabaseAdmin()
    const { exists, error } = await ensureTableExists(supabase, ORDER_TABLE)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    if (!exists) return NextResponse.json({ ok: false, error: "Tabela 'pedidos' inexistente." }, { status: 400 })

    const updateData = {
      status,
      atualizado_em: new Date().toISOString(),
    }

    const result = await supabase.from(ORDER_TABLE).update(updateData).eq("id", id)
    if (result.error) return NextResponse.json({ ok: false, error: result.error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

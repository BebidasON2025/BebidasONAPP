import { NextResponse } from "next/server"
import { getSupabaseAdmin, ensureTableExists, isMissingTableError } from "@/lib/db-helpers"

const ORDER_TABLE = "pedidos"
const PRODUCT_TABLE = "produtos"

type PedidoItemAny = {
  produto_id?: string
  produtoId?: string
  productId?: string
  id?: string
  qtd?: number
  qty?: number
  preco?: number
  price?: number
  nome?: string
  name?: string
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
  valor_pago?: number
  troco?: number
  endereco_entrega?: string
  telefone_cliente?: string
  observacoes?: string
  origem?: string
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

    console.log(
      "[v0] Order creation payload received:",
      JSON.stringify({
        items: payload.items,
        total: payload.total,
        metodo: payload.metodo,
      }),
    )

    const ordersExists = await ensureTableExists(supabase, ORDER_TABLE)
    if (ordersExists.error) return NextResponse.json({ ok: false, error: ordersExists.error.message }, { status: 500 })
    if (!ordersExists.exists)
      return NextResponse.json({ ok: false, error: "Tabela 'pedidos' inexistente." }, { status: 400 })

    const itemsRaw = Array.isArray(payload.items) ? payload.items : []
    console.log("[v0] Raw items array:", JSON.stringify(itemsRaw))

    const items = await Promise.all(
      itemsRaw
        .map(async (it) => {
          const produto_id = it.produto_id || it.produtoId || it.productId || it.id
          const qtd = Number(it.qtd ?? it.qty ?? 0)
          const preco = Number(it.preco ?? it.price ?? 0)
          let nome = it.nome || it.name || "Produto"

          // Get product name if not provided
          if (!it.nome && !it.name && produto_id) {
            const { data: product } = await supabase.from(PRODUCT_TABLE).select("nome").eq("id", produto_id).single()
            nome = product?.nome || "Produto"
          }

          return {
            produto_id,
            qtd,
            preco,
            nome,
            subtotal: qtd * preco,
          }
        })
        .filter((i) => i.produto_id && i.qtd > 0),
    )

    console.log("[v0] Processed items for storage:", JSON.stringify(items))

    const itensTotal = items.reduce((acc, it) => acc + Number(it.subtotal ?? 0), 0)
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
      itens: items, // Store items as JSONB in pedidos table
      valor_pago: payload.valor_pago ?? total,
      troco: payload.troco ?? 0,
      desconto: desconto,
      taxa_entrega: taxa,
      endereco_entrega: payload.endereco_entrega ?? null,
      telefone_cliente: payload.telefone_cliente ?? null,
      observacoes: payload.observacoes ?? null,
      origem: payload.origem ?? "sistema",
      tipo_transacao: "venda",
    }

    console.log(
      "[v0] Order object before insert:",
      JSON.stringify({
        numero_pedido: insertOrder.numero_pedido,
        itens: insertOrder.itens,
        total: insertOrder.total,
      }),
    )

    const created = await supabase.from(ORDER_TABLE).insert([insertOrder]).select("id, numero_pedido, itens").single()
    if (created.error) {
      console.error("[v0] Order creation error:", created.error)
      return NextResponse.json({ ok: false, error: created.error.message }, { status: 500 })
    }

    const pedidoId = created.data?.id as string
    const pedidoNumber = created.data?.numero_pedido || orderNumber

    console.log("[v0] Order created successfully:", {
      id: pedidoId,
      numero: pedidoNumber,
      storedItems: created.data?.itens,
    })

    const { data: verifyOrder } = await supabase
      .from(ORDER_TABLE)
      .select("id, numero_pedido, itens")
      .eq("id", pedidoId)
      .single()
    console.log("[v0] Verification - Order retrieved after creation:", {
      id: verifyOrder?.id,
      numero: verifyOrder?.numero_pedido,
      itens: verifyOrder?.itens,
    })

    if (items.length > 0) {
      console.log("[v0] Starting inventory deduction for", items.length, "items")

      const prodExists = await ensureTableExists(supabase, PRODUCT_TABLE)
      if (prodExists.error) {
        console.error("[v0] Product table check failed:", prodExists.error)
      } else if (!prodExists.exists) {
        console.error("[v0] Product table does not exist")
      } else {
        console.log("[v0] Product table exists, proceeding with inventory deduction")

        const byProduct = new Map<string, number>()
        for (const it of items) {
          const currentQty = byProduct.get(it.produto_id!) ?? 0
          const newQty = currentQty + Number(it.qtd ?? 0)
          byProduct.set(it.produto_id!, newQty)
          console.log("[v0] Product", it.produto_id, "quantity to deduct:", newQty)
        }

        const ids = Array.from(byProduct.keys())
        console.log("[v0] Product IDs to update:", ids)

        if (ids.length) {
          const stocks = await supabase.from(PRODUCT_TABLE).select("id, estoque, nome").in("id", ids)
          if (stocks.error) {
            console.error("[v0] Error fetching current stock levels:", stocks.error)
          } else {
            console.log("[v0] Current stock levels:", stocks.data)

            const updates = (stocks.data || []).map((row: any) => {
              const dec = byProduct.get(row.id) ?? 0
              const current = Number(row.estoque ?? 0)
              const next = Math.max(0, current - dec)
              console.log("[v0] Product", row.nome, "- Current:", current, "Deduct:", dec, "New:", next)
              return { id: row.id, estoque: next, nome: row.nome }
            })

            console.log("[v0] Inventory updates to apply:", updates)

            for (const u of updates) {
              const updateResult = await supabase.from(PRODUCT_TABLE).update({ estoque: u.estoque }).eq("id", u.id)
              if (updateResult.error) {
                console.error("[v0] Error updating inventory for", u.nome, ":", updateResult.error)
              } else {
                console.log("[v0] Successfully updated inventory for", u.nome, "to", u.estoque)
              }
            }

            // Verify inventory updates
            const verifyStocks = await supabase.from(PRODUCT_TABLE).select("id, estoque, nome").in("id", ids)
            if (!verifyStocks.error) {
              console.log("[v0] Verified inventory levels after update:", verifyStocks.data)
            }
          }
        }
      }
    } else {
      console.log("[v0] No items to process for inventory deduction")
    }

    return NextResponse.json({ ok: true, id: pedidoId, numero: pedidoNumber })
  } catch (e: any) {
    console.error("[v0] Order creation exception:", e)
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

    const { data: orderData } = await supabase.from(ORDER_TABLE).select("*").eq("id", id).single()

    const updateData = {
      status,
      atualizado_em: new Date().toISOString(),
      ...(status === "pago" && {
        transacao_financeira: {
          tipo: "entrada",
          descricao: `Pedido ${orderData?.numero_pedido || id} - Pagamento`,
          categoria: "Vendas",
          valor: Number(orderData?.total || 0),
          metodo: orderData?.metodo || "Dinheiro",
          data: new Date().toISOString(),
        },
        data_pagamento: new Date().toISOString(),
      }),
    }

    const result = await supabase.from(ORDER_TABLE).update(updateData).eq("id", id)
    if (result.error) return NextResponse.json({ ok: false, error: result.error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

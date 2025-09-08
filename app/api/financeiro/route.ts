import { NextResponse } from "next/server"
import { getSupabaseAdmin, ensureTableExists, isMissingTableError } from "@/lib/db-helpers"

const PEDIDOS_TABLE = "pedidos"

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const { exists, error } = await ensureTableExists(supabase, PEDIDOS_TABLE)
    if (error) return NextResponse.json({ ok: false, error: error.message, data: [] }, { status: 500 })
    if (!exists) return NextResponse.json({ ok: true, data: [], table: null })

    const { data, error: queryError } = await supabase
      .from(PEDIDOS_TABLE)
      .select("*")
      .eq("status", "pago")
      .order("data_pagamento", { ascending: false })

    if (queryError) {
      if (isMissingTableError(queryError)) return NextResponse.json({ ok: true, data: [], table: PEDIDOS_TABLE })
      return NextResponse.json({ ok: false, error: queryError.message, data: [] }, { status: 500 })
    }

    const mapped = (data || []).map((order: any) => ({
      id: order.id,
      tipo: "entrada",
      descricao: `Pedido ${order.numero_pedido || order.id} - ${order.cliente_nome_texto || "Cliente"}`,
      categoria: "Vendas",
      metodo: order.metodo || "Dinheiro",
      valor: Number(order.total || 0),
      data: order.data_pagamento || order.data || order.criado_em,
      pedido_id: order.id,
      raw: order,
    }))

    return NextResponse.json({ ok: true, data: mapped, table: PEDIDOS_TABLE })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e), data: [] }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { type, description, category, amount, method } = body || {}
    if (!type || !description || !category || amount == null || !method) {
      return NextResponse.json(
        { ok: false, error: "Campos obrigatórios: type, description, category, amount, method" },
        { status: 400 },
      )
    }

    const supabase = getSupabaseAdmin()
    const { exists, error } = await ensureTableExists(supabase, PEDIDOS_TABLE)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    if (!exists) return NextResponse.json({ ok: false, error: "Tabela 'pedidos' inexistente." }, { status: 400 })

    const r = await supabase
      .from(PEDIDOS_TABLE)
      .insert({
        tipo: type,
        descricao: description,
        categoria: category,
        valor: Number(amount || 0),
        metodo: method,
        data: new Date().toISOString(),
        status: "pago",
      })
      .select("*")
      .single()

    if (r.error) return NextResponse.json({ ok: false, error: r.error.message }, { status: 500 })
    return NextResponse.json({ ok: true, data: r.data })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { id } = body || {}
    if (!id) return NextResponse.json({ ok: false, error: "Campo 'id' é obrigatório" }, { status: 400 })

    const supabase = getSupabaseAdmin()
    const { exists, error } = await ensureTableExists(supabase, PEDIDOS_TABLE)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    if (!exists) return NextResponse.json({ ok: false, error: "Tabela 'pedidos' inexistente." }, { status: 400 })

    const r = await supabase.from(PEDIDOS_TABLE).delete().eq("id", id)
    if (r.error) return NextResponse.json({ ok: false, error: r.error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

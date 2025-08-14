import { NextResponse } from "next/server"
import { getSupabaseAdmin, ensureTableExists } from "@/lib/db-helpers"

// Agora usa as tabelas específicas de fiado
const PEDIDOS_TABLE = "pedidos"
const COMPROVANTES_TABLE = "comprovantes_fiado"
const CLIENTES_TABLE = "clientes"

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    const pedidosExists = await ensureTableExists(supabase, PEDIDOS_TABLE)
    let pedidosData: any[] = []

    if (!pedidosExists.error && pedidosExists.exists) {
      const r = await supabase
        .from(PEDIDOS_TABLE)
        .select("*")
        .eq("metodo", "Fiado")
        .eq("status", "pendente")
        .order("criado_em", { ascending: false })

      if (!r.error) {
        pedidosData = r.data || []
      }
    }

    const compExists = await ensureTableExists(supabase, COMPROVANTES_TABLE)
    let comprovantesData: any[] = []

    if (!compExists.error && compExists.exists) {
      const r = await supabase
        .from(COMPROVANTES_TABLE)
        .select("*")
        .eq("pago", false)
        .order("criado_em", { ascending: false })

      if (!r.error) {
        comprovantesData = r.data || []
      }
    }

    const allData = [...pedidosData, ...comprovantesData]
    const clientIds = Array.from(new Set(allData.map((x: any) => x.cliente_id).filter(Boolean)))
    const clients: Record<string, any> = {}

    if (clientIds.length) {
      const cExists = await ensureTableExists(supabase, CLIENTES_TABLE)
      if (!cExists.error && cExists.exists) {
        const cr = await supabase.from(CLIENTES_TABLE).select("*").in("id", clientIds)
        if (!cr.error && cr.data) {
          for (const cl of cr.data) clients[cl.id] = cl
        }
      }
    }

    const data = allData.map((x: any) => {
      const cl = x.cliente_id ? clients[x.cliente_id] : null
      return {
        id: x.id,
        clientName: x.cliente_nome_texto ?? cl?.nome ?? cl?.name ?? "—",
        phone: cl?.telefone ?? cl?.phone ?? null,
        email: cl?.email ?? null,
        items: [],
        total: Number(x.total ?? 0),
        dueDate: x.vencimento ?? null,
        method: x.metodo ?? "Fiado",
        date: x.data ?? x.criado_em ?? x.atualizado_em ?? new Date().toISOString(),
        paid: x.status === "pago" || Boolean(x.pago),
      }
    })

    return NextResponse.json({ ok: true, data, table: `${PEDIDOS_TABLE}+${COMPROVANTES_TABLE}` })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e), data: [] }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, paid } = await req.json().catch(() => ({}))
    if (!id) return NextResponse.json({ ok: false, error: "id é obrigatório" }, { status: 400 })

    const supabase = getSupabaseAdmin()
    const cExists = await ensureTableExists(supabase, COMPROVANTES_TABLE)
    if (!cExists.exists)
      return NextResponse.json({ ok: false, error: "Tabela 'comprovantes_fiado' inexistente." }, { status: 400 })

    const r = await supabase
      .from(COMPROVANTES_TABLE)
      .update({ pago: Boolean(paid) })
      .eq("id", id)
    if (r.error) return NextResponse.json({ ok: false, error: r.error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json().catch(() => ({}))
    if (!id) return NextResponse.json({ ok: false, error: "id é obrigatório" }, { status: 400 })

    const supabase = getSupabaseAdmin()
    const cExists = await ensureTableExists(supabase, COMPROVANTES_TABLE)
    if (!cExists.exists)
      return NextResponse.json({ ok: false, error: "Tabela 'comprovantes_fiado' inexistente." }, { status: 400 })

    const r = await supabase.from(COMPROVANTES_TABLE).delete().eq("id", id)
    if (r.error) return NextResponse.json({ ok: false, error: r.error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
